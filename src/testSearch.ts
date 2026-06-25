import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama"; // 1. Ändrat till ChatOllama
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import { saveFinancialData } from "./db/db.js";
import { request } from "http";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

// 1. Initiera Turndown med grundinställningar
const turndownService = new TurndownService({
    headingStyle: 'atx',       // Använder # för rubriker istället för understrykning
    hr: '---',                 // Avgränsare
    bulletListMarker: '*',     // Punktlistor med *
    codeBlockStyle: 'fenced'   // Kodblock med ```
});

// 2. Aktivera GFM (GitHub Flavored Markdown) för att stödja tabeller (|---|)
turndownService.use(gfm);

dotenv.config();

function extractChunk(cleanRapportText: string, keyword: string, keyTags:string[]) {
    let pos = cleanRapportText.indexOf(keyword);
    let counter = 0;
    let rapportChunk = "";

    while(pos !== -1) {
        counter++;
        console.log(`pos: ${pos}`);
       // Vi backar 1000 tecken för att få med "Nettoomsättning" som ligger precis ovanför
        // Och tar 5000 tecken totalt för att få med hela rapporten ned till resultat per aktie
        const startClip = Math.max(0, pos - 1000); // Backa lite mer (500 tecken) så vi inte missar tabellhuvudet
        const candidateChunk = cleanRapportText.substring(startClip, startClip + 12000); // Ta 5000 tecken framåt
        const candidateLower = candidateChunk.toLowerCase();

        let score = 0;

        for (let i = 0; i < keyTags.length; i++) {
            if(candidateLower.includes(`${keyTags[i]}`)) {
                score++;
            }
        }

        if(score >= 4) {
            console.log(`🎯 Den RIKTIGA ESEF-tabellen hittades vid position ${pos}!`);
            rapportChunk = candidateLower; 
            break; 
        }

        pos = cleanRapportText.indexOf(keyword, (pos + 1));
    }

    if(rapportChunk) {
        console.log("We got the bestChunk!!");
        // fs.writeFileSync(path.join(process.cwd(), `${keyword}.md`), rapportChunk);
        return rapportChunk;
        
    }
    return "";
}

async function processSingleFile(fileName: string, model: any) {
    // 1. Sätt upp filen du vill testa med (ändra till en pdf eller zip du har i mappen)
    const filePath = path.join(process.cwd(), 'downloads', fileName);

    console.log(`Läser fil: ${filePath}`);

    const fileType = `.xhtml`

    // 2. Extrahera texten från ZIP (samma logik som du byggde innan)
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    const reportEntry = zipEntries.find(entry => 
        (entry.entryName.endsWith(".xhtml") || entry.entryName.endsWith(".html")) && 
        !entry.entryName.includes("__MACOSX")
    );

    if (!reportEntry) {
        console.log("Hittade ingen rapport i ZIP-filen.");
        return;
    }

    let wholeRapportText = reportEntry.getData().toString("utf8");
    wholeRapportText = wholeRapportText.replace(/data:image\/[^;]+;base64,[^\s"']+/g, "");
    wholeRapportText = wholeRapportText.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");


    // 3. HÄR GÖR DU OM TILL MARKDOWN 
  

    // 4. Nu arbetar du med ren Markdown i din sökning!
    let cleanRapportText = wholeRapportText.toLowerCase();

    
    const keyword = "koncernens resultaträkning".toLowerCase(); // Kom ihåg små bokstäver!

    let yearRapportWords: string[] = ['belopp i msek', 'msek', 'belopp i tsek', 'tsek', 'ifrs-full:', 'ix:nonfraction',
        'omsättning', 'revenue', 'resultat', 'comprehensiveincome', 'operatingprofit'
    ]

    let yearRapportChunk = extractChunk(cleanRapportText, keyword, yearRapportWords);

    if(yearRapportChunk) {
        console.log("We got a hit!");
        
        fs.writeFileSync(path.join(process.cwd(), `year_rapport${fileType}`), yearRapportChunk);
        console.log(`💾 Sparade ${fileType}-texten till 'year_rapport${fileType}'!`);
    } else {
        console.log("We did not get a good enough one wont save!!!");
    }

    const balansKeyword = "eget kapital och skulder".toLowerCase();
    let balansRapportWords: string[] = [
    'belopp i msek', 'msek', 'belopp i tsek', 'tsek', 'ifrs-full:', 'ix:nonfraction',
    'eget kapital', 'equity', 'tillgångar', 'assets', 'skulder', 'liabilities', 'ifrs-full:equityandliabilities', 'ifrs-full:currentliabilities'
    ];

    let balansRapportChunk = extractChunk(cleanRapportText, balansKeyword, balansRapportWords);

    if(balansRapportChunk) {
        console.log("We got a hit for Balansräkning!");
        
        fs.writeFileSync(path.join(process.cwd(), `balans_rapport${fileType}`), balansRapportChunk);
        console.log(`Sparade ${fileType}-texten till 'balans_rapport${fileType}'!`);
    } else {
        console.log("We did not get a good enough hit for Balansräkning!");
    }

    // Ändra sökordet till något som garanterat står i tabellhuvudet/början utan avbrott
    const kassaflodeKeyword = "löpande verksamheten".toLowerCase();
    let kassaflodeWords: string[] = [
    'belopp i msek', 'msek', 'belopp i tsek', 'tsek', 'ifrs-full:', 'ix:nonfraction',
    'kassaflödesanalys', 'operatingactivities', 'kassaflöde', 'cash flows', 'ifrs-full:cashflowsfromusedinoperatingactivities'
    ];


    let kassaflodeRapportChunk = extractChunk(cleanRapportText, kassaflodeKeyword, kassaflodeWords);

    if(kassaflodeRapportChunk) {
        console.log("We got a hit for Kassaflödesanalys!");

        fs.writeFileSync(path.join(process.cwd(), `kassaflode_rapport${fileType}`), kassaflodeRapportChunk);
        console.log(`💾 Sparade ${fileType}}-texten till 'kassaflode_rapport${fileType}'!`);
    } else {
        console.log("We did not get a good enough hit for Kassaflödesanalys!");
    }

    const fileYear = fileName.split('_');
    console.log(`fileYear[1]: ${fileYear[1]}`)


 const prompt = `
    Du är en finansiell analytiker expert på IFRS och ESEF-rapportering. 
    Din uppgift är att noggrant extrahera finansiell data från de tre bifogade rapportklippen: Resultaträkning, Balansräkning och Kassaflödesanalys.

    Extrahera data för ALLA tillgängliga räkenskapsår som du hittar i klippen (oftast finns både det aktuella huvudåret och föregående jämförelseår med i tabellerna).

    ### RAPPORTKLIPP ATT ANALYSERA:
    Klipp 1 (Resultat): ${yearRapportChunk}
    Klipp 2 (Balans): ${balansRapportChunk}
    Klipp 3 (Kassaflöde): ${kassaflodeRapportChunk}

    ### STRÄNGA INSTRUKTIONER FÖR FORMATERING:
    1. Svara ENBART med en strukturerad JSON-array. Skriv ingen introduktion, ingen förklarande text och använd INGA markdown-block eller taggar (använd INTE \`\`\`json). Texten SKA börja direkt med '[' och sluta med ']'.
    2. Alla finansiella värden SKA vara rena nummer (inte strängar). 
    3. Ta bort alla tusentalsavgränsare och mellanslag i siffrorna (t.ex. "4 143" SKA bli 4143).
    4. Konvertera svenska decimaltecken från kommatecken till punkt (t.ex. "3,45" eller "3,450" SKA bli 3.45).
    5. Behåll minustecken för negativa värden. Om ett tal redovisas inom parentes eller med ett minustecken (t.ex. "(31)" eller "-31"), konvertera det till ett negativt nummer (-31).
    6. Koppla synonymer till rätt fält i JSON. Exempel: "Nettoomsättning" eller "Intäkter" mapar till "omsättning". "Rörelseresultat" eller "Rörelsevinst" mapar till "ebit".
    7. Om ett specifikt nyckeltal eller en rad saknas helt i klippen för ett visst år, sätt värdet till null.
    8. Identifiera enheten (t.ex. "msek" eller "tkr") i tabellhuvudet och sätt det i fältet "enhet".

    ### JSON-STRUKTUR (EXEMPEL):
    [
    {
        "år": 1234,
        "enhet": "msek",
        "omsättning": 1234.00,
        "ebit": 123.00,
        "årets_resultat": 123.00,
        "resultat_per_aktie": 1.23,
        "summa_tillgångar": 1234.00,
        "summa_eget_kapital": 1234.00,
        "långfristiga_skulder": 123.00,
        "kortfristiga_skulder": 123.00,
        "kassaflöde_löpande_verksamhet": 123.00,
        "investeringar_capex": -123.00
    }
    ]
    `;
        
    // // 3. Skicka till modellen
    // const response = await model.invoke(prompt);

    // const aiContent = response.content as string;
    // console.log(`\n🤖 Svar från modell:`);
    // console.log(aiContent);

    // // 4. LAGRA RESULTATET I DATABASEN
    // try {
    //     // Städa bort eventuella markdown-tagg-block om de kom med
    //     const cleanJsonString = aiContent
    //         .replace(/```json/g, "")
    //         .replace(/```/g, "")
    //         .trim();

    //     // Validera JSON-strukturen
    //     const jsonData = JSON.parse(cleanJsonString);
        
    //     // Extrahera information dynamiskt från filnamnet (t.ex. "HANZA_2023_SE0007130083.zip")
    //     const fileParts = fileName.replace(".zip", "").replace(".pdf", "").split("_");

    //     const companyNamn = fileParts[0] || "OKÄNT_BOLAG";
    //     const isinCode = fileParts[2] || "OKÄND_ISIN"; // Index 2 eftersom ISIN ligger som tredje element

    //     // Spara i databasen genom att loopa igenom AI:ns JSON-svar
    //     for (const row of jsonData) {
    //         await saveFinancialData({
    //             company_namn: companyNamn,
    //             isin: isinCode,
    //             ar: Number(row.år),
    //             enhet: row.enhet || 'msek', // Tar enhet från AI:n, annars default till msek
                
    //             // --- RESULTAT ---
    //             omsattning: row.omsättning !== undefined ? row.omsättning : null,
    //             rorelseresultat: row.rorelseresultat !== undefined ? row.rorelseresultat : (row.ebit !== undefined ? row.ebit : null),
    //             arets_resultat: row.årets_resultat !== undefined ? row.årets_resultat : null,
    //             resultat_per_aktie: row.resultat_per_aktie !== undefined ? row.resultat_per_aktie : null,
                
    //             // --- BALANS ---
    //             summa_tillgangar: row.summa_tillgångar !== undefined ? row.summa_tillgångar : null,
    //             summa_eget_kapital: row.summa_eget_kapital !== undefined ? row.summa_eget_kapital : null,
    //             langfristiga_skulder: row.långfristiga_skulder !== undefined ? row.långfristiga_skulder : null,
    //             kortfristiga_skulder: row.kortfristiga_skulder !== undefined ? row.kortfristiga_skulder : null,
                
    //             // --- KASSAFLÖDE ---
    //             kassaflode_lopande_verksamhet: row.kassaflöde_löpande_verksamhet !== undefined ? row.kassaflöde_löpande_verksamhet : null,
    //             investeringar_capex: row.investeringar_capex !== undefined ? row.investeringar_capex : null
    //         });
    //     }

    //     console.log(`✅ Klart! Data från ${fileName} har sparats i MySQL.`);
    // } catch (parseError) {
    //     console.error("❌ Svaret från AI:n kunde inte sparas som JSON. Det var inte i korrekt JSON-format:", parseError);
    // }
}

async function runBatchSearch() {
    const downloadsDir = path.join(process.cwd(), 'downloads');
    
    const chatModel = "llama-3.3-70b-versatile";

    // Läser alla filer i downloads-mappen
    const files = fs.readdirSync(downloadsDir);
    
    // Filtrera ut så vi bara kör .zip-filer (och hoppar över .pdf eller dolda systemfiler som .DS_Store)
    const zipFiles = files.filter(file => file.endsWith(".zip") && !file.startsWith("."));
    
    console.log(`zipFiles: ${zipFiles}`);

    console.log(`Hittade ${zipFiles.length} st ZIP-filer att analysera.`);

    // Initiera modellen en gång utanför loopen
    const model = new ChatGroq({
        model: chatModel, 
        temperature: 0, 
    });

    await processSingleFile(zipFiles[0], model);

    // Det magiska steget: En vanlig for...of-loop med await kör en fil i taget (sekventiellt)
    // for (const fileName of zipFiles) {
    //     await processSingleFile(fileName, model);

    //     // 2. RADERA FILEN AUTOMATISKT SÅ ATT MAPPEN ÄR TOM TILL NÄSTA GÅNG
    //     const filePath = path.join(downloadsDir, fileName);
    //     try {
    //         // fs.unlinkSync(filePath);
    //         // console.log(`🗑️ Raderade ${fileName} från downloads-mappen.`);
    //     } catch (cleanupError) {
    //         // console.error(`⚠️ Kunde inte radera filen ${fileName}:`, cleanupError);
    //     }
    //     break;
    // }

  

    console.log("\n🚀 Allt klart! Samtliga filer har gåtts igenom sekventiellt.");
    process.exit(0);
}



runBatchSearch().catch(console.error);