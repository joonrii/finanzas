// Diccionario de arranque para sugerir categoría según el texto del
// comercio en el CSV del banco. Es una primera versión sencilla por
// palabras clave; en la Fase 5 esto se sustituye/complementa por
// reglas que la app aprende de tus propias correcciones (merchant_rules).

const KEYWORD_MAP: { keywords: string[]; categoryName: string }[] = [
  { keywords: ["mercadona", "carrefour", "eroski", "dia ", "alcampo", "lidl"], categoryName: "Alimentación" },
  { keywords: ["spotify", "netflix", "hbo", "disney+", "prime video", "youtube premium"], categoryName: "Suscripciones" },
  { keywords: ["uber", "cabify", "bolt", "renfe", "emt", "metro madrid", "gasolinera", "repsol", "cepsa"], categoryName: "Transporte" },
  { keywords: ["decathlon", "gimnasio", "gym", "basic fit"], categoryName: "Deporte" },
  { keywords: ["farmacia", "seguros", "sanitas", "adeslas"], categoryName: "Salud" },
  { keywords: ["nomina", "nómina", "payroll"], categoryName: "Nómina" },
  { keywords: ["myinvestor", "indexa", "traderepublic", "trade republic"], categoryName: "Inversión" },
  { keywords: ["amazon", "zara", "el corte ingles", "el corte inglés"], categoryName: "Compras" },
  { keywords: ["restaurante", "bar ", "cafeteria", "cafetería", "glovo", "just eat", "uber eats"], categoryName: "Restaurantes" },
  { keywords: ["alquiler", "hipoteca", "comunidad de propietarios", "iberdrola", "endesa", "naturgy"], categoryName: "Vivienda" },
  { keywords: ["ryanair", "vueling", "iberia", "booking", "airbnb"], categoryName: "Viajes" },
];

export function guessCategoryName(description: string): string | null {
  const normalized = description.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((k) => normalized.includes(k))) {
      return entry.categoryName;
    }
  }
  return null;
}
