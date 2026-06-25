import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { readResultatrakning, readBalansrakning, readKassaflode } from "./tools/yearReportTool.js";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import { ChatOllama } from "@langchain/ollama";

dotenv.config();

const model = new ChatOllama({
    model: "llama3.2:latest",
    temperature: 0, 
});

const memory = new MemorySaver();

const systemMessage = `
Du är en expert på finansiell analys. Din uppgift är att extrahera finansiell data ur färdiga rapportklipp som ligger sparade lokalt i projektet.

Du ska köra en strikt trestegsprocess och anropa verktygen sekventiellt i den här ordningen:
1. Anropa 'readResultatrakning' för att läsa och analysera resultaträkningen.
2. När du har fått det svaret, anropa 'readBalansrakning' för att läsa och analysera balansräkningen.
3. Anropa slutligen 'readKassaflode' för att läsa kassaflödesanalysen.

VIKTIGT: Kör ALDRIG verktygen parallellt. Vänta på svar från det föregående verktyget innan du anropar nästa. 

När du har samlat in data från alla tre verktyg, sammanställ det färdiga resultatet till en exakt JSON-struktur enligt följande exempel:

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

export const agent = createReactAgent({
    llm: model,
    tools: [readResultatrakning, readBalansrakning, readKassaflode], // FIXAT: Nu skickas rätt tre verktyg med!
    messageModifier: systemMessage,
    checkpointSaver: memory,
});