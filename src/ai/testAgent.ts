import { agent } from "./agent.js";
import { HumanMessage } from "@langchain/core/messages";

async function run() {
    const response = await agent.invoke(
        // Argument 1: Input (Statet för grafen)
        {
            messages: [
                new HumanMessage(`Extrahera data från de sparade rapporterna.`)
            ],
        },
        // Argument 2: Options (Här samlar vi ALLA inställningar)
        { 
            recursionLimit: 50,                  // Höj gränsen till 50 steg
            configurable: { thread_id: "42" }    // Tråd-ID för MemorySaver
        }
    );

    const sistaSvaret = response.messages[response.messages.length - 1];
    console.log("\n🤖 Agentens svar:\n", sistaSvaret.content);
}
run().catch(console.error);