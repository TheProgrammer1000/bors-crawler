import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";

const fileType = `.xhtml`;

// --- VERKTYG 1: RESULTATRÄKNING ---
export const readResultatrakning = tool(
    async () => {
        console.log(`🤖 Hämtar Resultaträkning...`);

        try {
            const filePath = path.join(process.cwd(), `year_rapport${fileType}`);
            if (!fs.existsSync(filePath)) {
                console.error(`Hittade inte filen year_rapport${fileType}`);
                return `Hittade inte 'year_rapport${fileType}' i projektets root.`;
            }
            return fs.readFileSync(filePath, "utf8");
        } catch (error: any) { 
            return `Fel vid läsning av resultaträkning: ${error.message}`;
        }
    },
    {
        name: "readResultatrakning", // FIXAT: Matchar din import och agent-array exakt
        description: `Hämta den färdiga resultaträkningen och läs ut finansiella siffror. Tar inga argument.`,
        schema: z.object({}), // FIXAT: Tomt schema = inga påhittade argument från LLM
    }
);

// --- VERKTYG 2: BALANSRÄKNING ---
export const readBalansrakning = tool(
    async () => {
        const rapport = "balans_rapport";
        console.log(`🤖 Hämtar Balansräkning...`);
        
        try {
            const filePath = path.join(process.cwd(), `${rapport}${fileType}`);
            if (!fs.existsSync(filePath)) {
                console.error(`Hittade inte filen ${rapport}${fileType}`);
                return `Hittade inte '${rapport}${fileType}' i projektets root.`;
            }
            return fs.readFileSync(filePath, "utf8");
        } catch (error: any) { 
            return `Fel vid läsning av ${rapport}${fileType}: ${error.message}`;
        }
    },
    {
        name: "readBalansrakning", // FIXAT: Matchar din import
        description: "Hämta den färdiga Balansräkningen och läs ut finansiella siffror. Tar inga argument.",
        schema: z.object({}), // FIXAT: Tomt schema
    }
);

// --- VERKTYG 3: KASSAFLÖDE ---
export const readKassarakning = tool(
    async () => {
        const rapport = "kassaflode_rapport";
        console.log(`🤖 Hämtar Kassaflödesanalys...`);
        
        try {
            const filePath = path.join(process.cwd(), `${rapport}${fileType}`);
            if (!fs.existsSync(filePath)) {
                console.error(`Hittade inte filen ${rapport}${fileType}`);
                return `Hittade inte '${rapport}${fileType}' i projektets root.`;
            }
            return fs.readFileSync(filePath, "utf8");
        } catch (error: any) { 
            return `Fel vid läsning av ${rapport}${fileType}: ${error.message}`;
        }
    },
    {
        name: 'readKassarakning', // FIXAT: Matchar din import
        description: "Hämta den färdiga Kassaflödesanalysen och läs ut finansiella siffror. Tar inga argument.",
        schema: z.object({}), // FIXAT: Tomt schema
    }
);