import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- VERKTYG 1: RESULTATRÄKNING ---
export const readResultatrakning = tool(
    async ({ kommando }) => {
        console.log(`🤖 Hämtar Resultaträkning (Kommando: ${kommando})...`);
        try {
            const filePath = path.join(process.cwd(), 'year_rapport.md');
            if (!fs.existsSync(filePath)) {
                console.error(`Hittade inte filen year_rapport.md`);
                return "Hittade inte 'year_rapport.md' i projektets root.";
            }
            return fs.readFileSync(filePath, "utf8");
        } catch (error) { // Fixat: Tog bort ": Error" som bröt syntaxen
            return `Fel vid läsning av resultaträkning: ${error.message}`;
        }
    },
    {
        name: "readResultatrakning",
        description: "Steg 1: Använd ALLTID detta verktyg först. Hämtar den färdiga resultaträkningen.",
        schema: z.object({
            kommando: z.string().describe("Skriv 'Hämta resultat' här.")
        }),
    }
);

// --- VERKTYG 2: BALANSRÄKNING (Med 15s fördröjning) ---
export const readBalansrakning = tool(
    async ({ kommando }) => {
        console.log("⏳ Väntar i 15 sekunder innan vi hämtar Balansräkningen...");
        await sleep(15000);
        
        console.log(`🤖 Hämtar Balansräkning (Kommando: ${kommando})...`);
        try {
            const filePath = path.join(process.cwd(), "balans_rapport.md");
            if (!fs.existsSync(filePath)) {
                return "Hittade inte 'balans_rapport.md' i projektets root.";
            }
            return fs.readFileSync(filePath, "utf8");
        } catch (error) {
            return `Fel vid läsning av balansräkning: ${error.message}`;
        }
    },
    {
        name: "readBalansrakning",
        description: "Steg 2: Använd detta verktyg efter resultaträkningen. Hämtar den färdiga balansräkningen.",
        schema: z.object({
            kommando: z.string().describe("Skriv 'Hämta balans' här.")
        }),
    }
);

// --- VERKTYG 3: KASSAFLÖDE (Med 15s fördröjning) ---
export const readKassaflode = tool(
    async ({ kommando }) => {
        console.log("⏳ Väntar i 15 sekunder innan vi hämtar Kassaflödet...");
        await sleep(15000);
        
        console.log(`🤖 Hämtar Kassaflödesanalys (Kommando: ${kommando})...`);
        try {
            const filePath = path.join(process.cwd(), "kassaflode_rapport.md");
            if (!fs.existsSync(filePath)) {
                return "Hittade inte 'kassaflode_rapport.md' i projektets root.";
            }
            return fs.readFileSync(filePath, "utf8");
        } catch (error) {
            return `Fel vid läsning av kassaflödesanalys: ${error.message}`;
        }
    },
    {
        name: "readKassaflode",
        description: "Steg 3: Använd detta verktyg sist. Hämtar den färdiga kassaflödesanalysen.",
        schema: z.object({
            kommando: z.string().describe("Skriv 'Hämta kassaflöde' här.")
        }),
    }
);