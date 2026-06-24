import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export const readZipReport = tool(
    async ({ fileName }) => {
        try {
            const filePath = path.join(process.cwd(), 'downloads', fileName);
            
            console.log(`\n[ZIP Tool] Försöker läsa fil: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                console.log(`[ZIP Tool] ❌ Hittade inte filen!`);
                return `Fel: Kunde inte hitta filen ${fileName} i downloads-mappen.`;
            }

            // Öppna ZIP-arkivet
            const zip = new AdmZip(filePath);
            const zipEntries = zip.getEntries();
            
            // Leta efter den huvudsakliga xhtml- eller html-rapporten (strunta i interna macOS-mappar)
            const reportEntry = zipEntries.find(entry => 
                (entry.entryName.endsWith(".xhtml") || entry.entryName.endsWith(".html")) && 
                !entry.entryName.includes("__MACOSX")
            );

            if (!reportEntry) {
                console.log(`[ZIP Tool] ❌ Hittade ingen .xhtml/.html-rapport inuti ZIP-filen.`);
                return "Fel: Hittade ingen .xhtml eller .html-rapport inuti ZIP-filen.";
            }

            console.log(`[ZIP Tool] ✅ Hittade rapportfil: ${reportEntry.entryName}`);
            
            // Läs ut källkoden som en textsträng
            const rawHtml = reportEntry.getData().toString("utf8");
            
            // Ta bort alla HTML-taggar och extra blanksteg så att AI:n bara får ren, kompakt text
            const cleanText = rawHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

            const lowerCleanText = cleanText.toLowerCase();

            const searchTerm: string = 'Koncernens resultaträkning'.toLowerCase();
            
            const indexOfSearch = lowerCleanText.indexOf(searchTerm);

            console.log(indexOfSearch)
            
            console.log(`[ZIP Tool] ✅ Extraherade ${cleanText.length} tecken råtext från XHTML.`);

            if (cleanText.length === 0) {
                return "Fel: Rapporten inuti ZIP-filen verkar vara tom.";
            }

            // Skär ut de första 25 000 tecknen så att sammanhanget inte blir för stort för din lokala LLM
            const truncatedText = cleanText.substring(0, 200); 
            return truncatedText;

        } catch (error: any) {
            console.log(`[ZIP Tool] ❌ Fel vid uppackning/läsning: ${error.message}`);
            return `Fel vid läsning av ZIP-rapport: ${error.message}`;
        }
    },
    {
        name: "readZipReport",
        description: "Använd detta verktyg för att läsa in texten från en årsredovisning sparad som en ZIP-fil (ESEF XHTML-format).",
        schema: z.object({
            fileName: z.string().describe("Namnet på zip-filen i downloads-mappen, t.ex. '2024_SE0007130083.zip'")
        }),
    }
);