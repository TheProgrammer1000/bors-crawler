export interface FinansData{
    company_namn: string;
    isin: string;
    ar: number;
    enhet: string;
    // --- Resultaträkning (Period: Hela året) ---
    omsattning: number | null;       // Nettoomsättning / Intäkter
    rorelseresultat: number | null;  // EBIT / Rörelsevinst
    resultat_fore_skatt: number | null; // EBT / Resultat efter finansiella poster (NY!)
    arets_resultat: number | null;   // Vinst efter skatt (Flyttad hit!)
    resultat_per_aktie: number | null;

    // --- Balansräkning (Ögonblicksbild: 31 dec) ---
    summa_tillgangar: number | null; // Totala tillgångar / Balansomslutning
    summa_eget_kapital: number | null;
    langfristiga_skulder: number | null; // Banklån, obligationslån mm. (NY!)
    kortfristiga_skulder: number | null; // Leverantörsskulder, kortfristiga lån
    
    // --- Kassaflödesanalys (Period: Hela året) ---
    forandring_rorelsekapital: number | null; // Bundet kapital i lager/kundfordringar (NY!)
    kassaflode_lopande_verksamhet: number | null; // Pengar från kärnverksamheten
    investeringar_capex: number | null; // Investeringar i maskiner/fastigheter/förvärv
    totalt_kassaflode: number | null; // Förändring av likvida medel totalt (NY!)

}