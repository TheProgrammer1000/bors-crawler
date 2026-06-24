import pool from "./db_connection.js";

export async function saveFinancialData(data: {
    company_namn: string;
    isin: string;
    ar: number;
    enhet: string;
    omsattning: number | null;
    rorelseresultat: number | null;
    arets_resultat: number | null;
    resultat_per_aktie: number | null;
    // --- NYA KOLUMNER HÄR ---
    summa_tillgangar: number | null;
    summa_eget_kapital: number | null;
    langfristiga_skulder: number | null;
    kortfristiga_skulder: number | null;
    kassaflode_lopande_verksamhet: number | null;
    investeringar_capex: number | null;
}) {
    const sql = `
        INSERT INTO company_financials (
            company_namn, isin, ar, enhet, 
            omsattning, rorelseresultat, arets_resultat, resultat_per_aktie,
            summa_tillgangar, summa_eget_kapital, langfristiga_skulder, kortfristiga_skulder,
            kassaflode_lopande_verksamhet, investeringar_capex
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            enhet = VALUES(enhet),
            omsattning = VALUES(omsattning),
            rorelseresultat = VALUES(rorelseresultat),
            arets_resultat = VALUES(arets_resultat),
            resultat_per_aktie = VALUES(resultat_per_aktie),
            summa_tillgangar = VALUES(summa_tillgangar),
            summa_eget_kapital = VALUES(summa_eget_kapital),
            langfristiga_skulder = VALUES(langfristiga_skulder),
            kortfristiga_skulder = VALUES(kortfristiga_skulder),
            kassaflode_lopande_verksamhet = VALUES(kassaflode_lopande_verksamhet),
            investeringar_capex = VALUES(investeringar_capex),
            updated_at = NOW();
    `;

    const values = [
        data.company_namn,
        data.isin,
        data.ar,
        data.enhet,
        data.omsattning,
        data.rorelseresultat,
        data.arets_resultat,
        data.resultat_per_aktie,
        // --- NYA VÄRDEN ---
        data.summa_tillgangar,
        data.summa_eget_kapital,
        data.langfristiga_skulder,
        data.kortfristiga_skulder,
        data.kassaflode_lopande_verksamhet,
        data.investeringar_capex
    ];

    try {
        const [result] = await pool.execute(sql, values);
        return result;
    } catch (error) {
        console.error("❌ Databasfel vid INSERT/UPSERT:", error);
        throw error;
    }
}