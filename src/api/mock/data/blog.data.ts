/* Articoli d'esempio del blog. Il corpo usa il formato semplice di lib/markdown.ts (## titoli, - elenchi, @embed url). */
export type BlogPost = {
  id: string; slug: string; titolo: string; estratto: string; copertina: string; corpo: string;
  pubblicato: boolean; data: string; autore: string; seoTitolo: string; seoDescrizione: string;
};

export const POSTS: BlogPost[] = [
  { id: "p1", slug: "impermeabilizzare-un-terrazzo", titolo: "Impermeabilizzare un terrazzo senza demolire", estratto: "Quando si può posare sopra il pavimento esistente e quali passaggi non saltare.", copertina: "", pubblicato: true, data: "2026-10-28", autore: "Luca Greco",
    seoTitolo: "Impermeabilizzare un terrazzo senza demolire", seoDescrizione: "Guida pratica: verifiche, prodotti e passaggi per impermeabilizzare un terrazzo sopra le piastrelle esistenti.",
    corpo: "Molti terrazzi si possono impermeabilizzare senza rimuovere il pavimento.\n\n## Le verifiche\n- Piastrelle ben aderenti\n- Pendenze corrette verso gli scarichi\n- Nessuna fessura strutturale\n\n## Il video\n@embed https://www.youtube.com/watch?v=dQw4w9WgXcQ\n\nSe hai dubbi, apri una richiesta di sopralluogo." },
  { id: "p2", slug: "massetto-autolivellante-tempi", titolo: "Massetto autolivellante: tempi e spessori", estratto: "Quanto aspettare prima della posa e come scegliere lo spessore giusto.", copertina: "", pubblicato: true, data: "2026-10-15", autore: "Sara Lombardo",
    seoTitolo: "Massetto autolivellante: tempi e spessori", seoDescrizione: "Tempi di attesa, spessori consigliati ed errori da evitare con i massetti autolivellanti.",
    corpo: "Lo spessore decide i tempi.\n\n## Spessori\n- Fino a 10 mm: posa dopo 24 ore\n- Oltre 10 mm: verifica l'umidità\n\n## Dove siamo\n@embed https://www.google.com/maps?q=Catania&output=embed" },
  { id: "p3", slug: "novita-catalogo-inverno", titolo: "Novità del catalogo per l'inverno", estratto: "Prodotti per lavorare anche con temperature basse.", copertina: "", pubblicato: false, data: "2026-11-01", autore: "Giulia Ferraro",
    seoTitolo: "", seoDescrizione: "", corpo: "Bozza in preparazione." },
];
