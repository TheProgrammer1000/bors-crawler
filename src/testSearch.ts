import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import dotenv from "dotenv";
import { saveFinancialData } from "./db/db.js";
import { request } from "http";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { runAgent } from "./ai/testAgent.js";

import { FinansData } from "./types.js";

// Hjälpfunktion för att pausa exekveringen (Rate Limiting)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


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
        const candidateChunk = cleanRapportText.substring(startClip, startClip + 30000); // Ta 5000 tecken framåt
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

   if (rapportChunk) {
        console.log("We got the bestChunk!!");
        return rapportChunk;
    }
    return "";
}
function extractFinansNumber(yearRapportChunk: string, keyWordsArray: string[]) {
    let cleanChunk = yearRapportChunk.toLowerCase();
    

    //let keywordsYearRapport = [keywordOmsattning, keywordRorelseResultat, keywordArResultat, keywordAktiePerResult, keyWordAktiePerResult2, keyWordAktierPerResult3];
    let arrayPos = [];


    for (let i = 0; i < keyWordsArray.length; i++) {
        
        let pos = cleanChunk.indexOf(keyWordsArray[i]);
        

        while(pos !== -1) {
            
            // 1. Logga den AKTUELLA träffen först
            console.log(`Träff \nKeyword: ${keyWordsArray[i]}\nhittades vid position: ${pos}`);
            
            arrayPos.push(pos);
            
            // 2. Sök sedan efter nästa (vilket kan bli -1 och stänga loopen inför nästa varv)
            pos = cleanChunk.indexOf(keyWordsArray[i], pos + 1);
        }
    }

    arrayPos.sort((a, b) => a - b);

    return arrayPos;
}

function chopMore(posBegin: number, posEnd: number, yearRapportChunk: string) {
    const candidateChunk = yearRapportChunk.substring(posBegin - 300, posEnd + 500); // Ta 5000 tecken framåt
    const candidateLower = candidateChunk.toLowerCase();

    return candidateLower;
}


async function processSingleFile(fileName: string) {
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
        fs.writeFileSync(path.join(process.cwd(), `year_rapport_test${fileType}`), yearRapportChunk);

        // let keywordOmsattning = "ifrs-full:revenue".toLowerCase(); 
        // let keywordRorelseResultat = `ifrs-full:ProfitLossFromOperatingActivities`.toLowerCase();
        // let keywordArResultat = `ifrs-full:comprehensiveincome`.toLowerCase();
        // let keywordAktiePerResult = `ifrs-full:BasicEarningsLossPerShare`.toLowerCase();

        // let keyWordAktiePerResult2 = `basicearningslosspershare`.toLowerCase();
        // let keyWordAktierPerResult3 = `basicearningspershare`.toLowerCase();

        let keyWordsYearResult: string[] = [
            "ifrs-full:revenue".toLowerCase(), 
            `ifrs-full:ProfitLossFromOperatingActivities`.toLowerCase(),
            `ifrs-full:comprehensiveincome`.toLowerCase(),
            `ifrs-full:BasicEarningsLossPerShare`.toLowerCase(),
            `basicearningslosspershare`.toLowerCase(),
            `basicearningspershare`.toLowerCase()
        ];

        let posArray = extractFinansNumber(yearRapportChunk, keyWordsYearResult);

        console.log(`posArray: ${posArray}`)
        yearRapportChunk = chopMore(posArray[0], posArray[posArray.length - 1], yearRapportChunk);

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

    const fileInfo = fileName.split('_');

    const companyName = fileInfo[0];
    const rapportYear = Number(fileInfo[1]);
    // Fix: Ersätt .zip med tom sträng ifall filändelsen hänger med
    const isin = fileInfo[2].replace(".zip", "").trim();


    try {
        console.log("Startar agenten...");
        let jsonText: string = await runAgent(); 

        // 1. Klipp ut ALLT som ligger mellan [ och ]
        const jsonMatch = jsonText.match(/\[([\s\S]*?)\]/);
        if (jsonMatch) {
            jsonText = jsonMatch[0]; 
        } else {
            jsonText = "[]"; 
        }

        // 2. Extra städnings-regex för markdown-block
        jsonText = jsonText.replace(/```json/gi, "").replace(/```/gi, "").trim();

        // 3. FIXAT: Ta bort hängande kommatecken (trailing commas) innan måsvingar och klamrar!
        jsonText = jsonText.replace(/,\s*([\]}])/g, '$1');

        // Nu kan vi parsa utan att det kraschar!
        const parsedData: any = JSON.parse(jsonText);
        const dataArray: any[] = Array.isArray(parsedData) ? parsedData : [parsedData];

        // Loopa igenom och spara varje räkenskapsår
        for (const rawData of dataArray) {
            
            // Här skapar vi det strikta objektet som följer ditt FinansData-interface
            const snyggFinansData: FinansData = {
                company_namn: companyName,
                isin: isin,
                ar: rawData.ar !== undefined ? Number(rawData.ar) : (rawData.år !== undefined ? Number(rawData.år) : rapportYear),
                enhet: rawData.enhet,

                // --- Resultaträkning ---
                omsattning: rawData.omsattning !== undefined ? rawData.omsattning : rawData.omsättning,
                rorelseresultat: rawData.rorelseresultat !== undefined ? rawData.rorelseresultat : rawData.ebit, // Mappar även mot ebit från prompten
                resultat_fore_skatt: rawData.resultat_fore_skatt,
                arets_resultat: rawData.arets_resultat !== undefined ? rawData.arets_resultat : rawData.årets_resultat,
                resultat_per_aktie: rawData.resultat_per_aktie,

                // --- Balansräkning ---
                summa_tillgangar: rawData.summa_tillgangar !== undefined ? rawData.summa_tillgangar : rawData.summa_tillgångar,
                summa_eget_kapital: rawData.summa_eget_kapital,
                langfristiga_skulder: rawData.langfristiga_skulder,
                kortfristiga_skulder: rawData.kortfristiga_skulder,

                // --- Kassaflödesanalys ---
                forandring_rorelsekapital: rawData.forandring_rorelsekapital,
                kassaflode_lopande_verksamhet: rawData.kassaflode_lopande_verksamhet !== undefined ? rawData.kassaflode_lopande_verksamhet : rawData.kassaflöde_löpande_verksamhet,
                investeringar_capex: rawData.investeringar_capex,
                totalt_kassaflode: rawData.totalt_kassaflode !== undefined ? rawData.totalt_kassaflode : rawData.totalt_kassaflöde
            };

            // Skicka det typade objektet till din DB-funktion
            await saveFinancialData(snyggFinansData);
        }

        console.log("✅ All finansiell data har mappats till FinansData-interfacet och sparats i databasen.");

    } catch (error) {
        console.error(`error: ${error.message}`)
    }
}

async function openAndScanZip() {
    const downloadsDir = path.join(process.cwd(), 'downloads');
    // Läser alla filer i downloads-mappen
    const files = fs.readdirSync(downloadsDir);
    
    // Filtrera ut så vi bara kör .zip-filer (och hoppar över .pdf eller dolda systemfiler som .DS_Store)
    const zipFiles = files.filter(file => file.endsWith(".zip") && !file.startsWith("."));

    console.log(`Hittade ${zipFiles.length} st ZIP-filer att analysera.`);

 
    // Ändra i openAndScanZip om du vill köra alla filer i mappen:
    for (let i = 0; i < zipFiles.length; i++) {
        const file = zipFiles[i];
        await processSingleFile(file);
        
        // Pausa i 61 sekunder mellan filer för att hålla oss under Groqs TPM-gräns
        if (i < zipFiles.length - 1) {
            console.log(`⏱️ Väntar 61 sekunder för att nollställa Groq Rate Limit (TPM)...`);
            await sleep(61000);
        }
    }

    console.log("\n🚀 Allt klart! Samtliga filer har gåtts igenom sekventiellt.");
    process.exit(0);
}



openAndScanZip().catch(console.error);