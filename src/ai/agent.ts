import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
// 1. Ändra importen från Ollama till Google GenAI
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { readZipReport } from "./pdfTool.js";

// Laddar in din GOOGLE_API_KEY från .env-filen
import dotenv from "dotenv";
dotenv.config();

// Sätt upp Gemini-modellen istället för Ollama
const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Mycket mer generös gratis-kvot!
    temperature: 0,          // Fortfarande 0 för att hålla siffrorna strikta och exakta
});
const memory = new MemorySaver();

const systemMessage = `
Du är en expert på finansiell analys. Din uppgift är att hjälpa användaren att hitta finansiell information (som omsättning, rörelseresultat/EBIT, och årets resultat) ur årsredovisningar i ZIP/XHTML-format.

Arbetsflöde:
1. När användaren frågar efter siffror för ett visst bolag och år, ska du använda verktyget 'readZipReport' för att läsa texten från rätt fil.
2. Eftersom du får en mycket stor del av (eller hela) rapporten, leta noggrant efter tabellen "Koncernens resultaträkning" (eller Income Statement).
3. Presentera alltid siffrorna strukturerat och tydligt.

VIKTIGT: Svara bara baserat på den text du faktiskt får från verktyget. Om du inte hittar siffrorna, säg det – gissa aldrig.
`;

export const agent = createReactAgent({
    llm: model,
    tools: [readZipReport],
    messageModifier: systemMessage,
    checkpointSaver: memory,
});