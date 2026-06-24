import { agent } from "./ai/tools/agent.js";
import { HumanMessage } from "@langchain/core/messages";

async function run() {
    // Ändra till namnet på en av filerna du faktiskt har i din downloads-mapp!
    // Ändra testfilen till din nya ZIP-fil!
    const testFile = "2024_SE0007130083.zip";

    const response = await agent.invoke(
        {
            messages: [
                new HumanMessage(`Kan du titta i filen "${testFile}" och ta ut nettoomsättning och rörelseresultat (EBIT)?`)
            ],
        },
        { configurable: { thread_id: "42" } } // Trådid för minnet
    );

    const sistaSvaret = response.messages[response.messages.length - 1];
    console.log("\n🤖 Agentens svar:\n", sistaSvaret.content);
}

run().catch(console.error);