import pool from "./db_connection.js";

export async function saveFinancialData(data: {
    // --- Allmän info --
    company_namn: string;
    isin: string;
    ar: number;
    enhet: string;
    // --- Resultaträkning (Period: Hela året) ---
    omsattning: number | null;       
    rorelseresultat: number | null;  
    resultat_fore_skatt: number | null; 
    arets_resultat: number | null;   
    resultat_per_aktie: number | null;

    // --- Balansräkning (Ögonblicksbild: 31 dec) ---
    summa_tillgangar: number | null; 
    summa_eget_kapital: number | null;
    langfristiga_skulder: number | null; 
    kortfristiga_skulder: number | null; 
    
    // --- Kassaflödesanalys (Period: Hela året) ---
    forandring_rorelsekapital: number | null; 
    kassaflode_lopande_verksamhet: number | null; 
    investeringar_capex: number | null; 
    totalt_kassaflode: number | null; 
}) {
    const sql = `
        INSERT INTO company_financials (
            company_namn, isin, ar, enhet, 
            omsattning, rorelseresultat, resultat_fore_skatt, arets_resultat, resultat_per_aktie,
            summa_tillgangar, summa_eget_kapital, langfristiga_skulder, kortfristiga_skulder,
            forandring_rorelsekapital, kassaflode_lopande_verksamhet, investeringar_capex, totalt_kassaflode
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            company_namn = VALUES(company_namn), -- Uppdatera namn om det ändrats
            enhet = VALUES(enhet),
            omsattning = VALUES(omsattning),
            rorelseresultat = VALUES(rorelseresultat),
            resultat_fore_skatt = VALUES(resultat_fore_skatt),
            arets_resultat = VALUES(arets_resultat),
            resultat_per_aktie = VALUES(resultat_per_aktie),
            summa_tillgangar = VALUES(summa_tillgangar),
            summa_eget_kapital = VALUES(summa_eget_kapital),
            langfristiga_skulder = VALUES(langfristiga_skulder),
            kortfristiga_skulder = VALUES(kortfristiga_skulder),
            forandring_rorelsekapital = VALUES(forandring_rorelsekapital),
            kassaflode_lopande_verksamhet = VALUES(kassaflode_lopande_verksamhet),
            investeringar_capex = VALUES(investeringar_capex),
            totalt_kassaflode = VALUES(totalt_kassaflode);
    `;

    // Viktigt: Ordningen här måste matcha frågetecknen (?) i SQL-frågan exakt
    const values = [
        data.company_namn,
        data.isin,
        data.ar,
        data.enhet,
        // --- Resultaträkning ---
        data.omsattning,
        data.rorelseresultat,
        data.resultat_fore_skatt,
        data.arets_resultat,
        data.resultat_per_aktie,
        // --- Balansräkning ---
        data.summa_tillgangar,
        data.summa_eget_kapital,
        data.langfristiga_skulder,
        data.kortfristiga_skulder,
        // --- Kassaflödesanalys ---
        data.forandring_rorelsekapital,
        data.kassaflode_lopande_verksamhet,
        data.investeringar_capex,
        data.totalt_kassaflode
    ];

    try {
        const [result] = await pool.execute(sql, values);
        return result;
    } catch (error) {
        console.error("❌ Databasfel vid INSERT/UPSERT:", error);
        throw error;
    }
}