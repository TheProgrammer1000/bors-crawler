import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { readResultatrakning, readBalansrakning, readKassarakning } from "./tools/yearReportTool.js";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import { ChatOllama } from "@langchain/ollama";

dotenv.config();

/*
 Limit 100000, Used 92426, Requested 11167. Please try again in 51m44.352s. 
 Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing",
 "type":"tokens","code":"rate_limit_exceeded"}}
*/

const modelName = `llama-3.1-8b-instant`

const model = new ChatGroq({
    model: modelName,
    temperature: 0, 
});

const memory = new MemorySaver();

const systemMessage = `
Du är en expert på finansiell analys. Din uppgift är att extrahera finansiell data ur färdiga rapportklipp som ligger sparade lokalt i projektet.

FÖLJ DESSA STRIKT STEG:
1. Anropa 'readResultatrakning' för att läsa och analysera resultaträkningen.


VIKTIGT REGLER FÖR DATA:
- Om du inte hittar ett specifikt värde i texten, sätt värdet till null. Du får ALDRIG gissa eller använda siffrorna från exemplet nedan om de inte faktiskt står i rapporten.
- Läs iXBRL-taggarna (t.ex. ix:nonfraction eller ifrs-full) noggrant för att hitta rätt rader.
- Du MÅSTE använda dina verktyg för att läsa filerna innan du svarar. Du får inte generera JSON-strukturen förrän du har kört alla tre verktyg.

När du har samlat in data, sammanställ det färdiga resultatet till en exakt JSON-struktur enligt följande EXEMPEL (använd bara strukturen, inte siffrorna!):
[  
    {
        "ar": 2023,
        "enhet": "msek",
        "omsattning": 0,
        "rorelseresultat": 0,
        "resultat_fore_skatt": 0,
        "arets_resultat": 0,
        "resultat_per_aktie": 0.00,
    }
]`

export const agent = createReactAgent({
    llm: model,
    tools: [readResultatrakning], // FIXAT: Nu skickas rätt tre verktyg med!
    messageModifier: systemMessage,
    checkpointSaver: memory,
});