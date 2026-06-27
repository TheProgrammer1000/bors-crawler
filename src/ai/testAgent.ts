import { agent } from "./agent.js";
import { HumanMessage } from "@langchain/core/messages";

/*

 `Börja med att använda dina tre verktyg sekventiellt för att läsa in texten från resultaträkningen, balansräkningen och kassaflödesanalysen. ` +
                    `När du har samlat in all data från verktygen, sammanställ det till en JSON-array enligt det format som beskrivs i dina systeminstruktioner.`
*/

export async function runAgent() {
    const response = await agent.invoke(
        {
            messages: [
                new HumanMessage(
                    `Börja med att använda ditt verktyg för att läsa in texten från resultaträkningen` +
                    `VIKTIGT: Dina verktyg tar INGA argument eller parametrar (skicka ett tomt objekt {}). ` +
                    `När du har samlat in all data från verktygen, sammanställ det till en JSON-array enligt det format som beskrivs i dina systeminstruktioner.`
                )
            ],
        },
        // Argument 2: Options
        { 
            recursionLimit: 50,                  // Höj gränsen till 50 steg
            configurable: { thread_id: "42" }    // Tråd-ID för MemorySaver
        }
    );

    const sistaSvaret = response.messages[response.messages.length - 1];
    
    // Säkerhetskoll: Om svaret faktiskt är tomt, logga det innan JSON.parse kraschar skriptet
    if (!sistaSvaret.content || sistaSvaret.content.trim() === "") {
        console.log("\n⚠️ Agenten returnerade ett tomt svar. Kontrollera att Ollama körs ordentligt.");
        return "[]";
    }

    console.log("\n🤖 Agentens svar:\n", sistaSvaret.content);
    return sistaSvaret.content;
}