export const menuPreparationsPt = {
  "Frango à Zambeziana": "Aproximadamente 20–30 min",
  "Frango Grelhado": "Aproximadamente 20 min",
  "Peixe Grelhado": "Aproximadamente 25–35 min",
  Matapa: "Aproximadamente 25 min",
  Chamuça: "Aproximadamente 10–15 min",
  "Rissóis": "Aproximadamente 10–15 min",
  "Batata frita": "Aproximadamente 10 min",
  "Hambúrguer Clássico": "Aproximadamente 15–20 min",
  "Hambúrguer Especial": "Aproximadamente 15–20 min",
  "Coca-Cola": "Servido imediatamente",
  Fanta: "Servido imediatamente",
  Água: "Servida fresca imediatamente",
  Sumol: "Servido imediatamente",
  Gelado: "Servido imediatamente",
  "Salada de Frutas": "Preparada na hora em aproximadamente 10 min",
} as const;

export const menuPreparationsEn = {
  "Frango à Zambeziana": "Prepared to order in approximately 20–30 min.",
  "Frango Grelhado": "Grilled to order in approximately 20 min.",
  "Peixe Grelhado": "Grilled to order in approximately 25–35 min.",
  Matapa: "Cooked slowly in approximately 25 min.",
  Chamuça: "Fried to order in approximately 10–15 min.",
  "Rissóis": "Fried to order in approximately 10–15 min.",
  "Batata frita": "Fried to order in approximately 10 min.",
  "Hambúrguer Clássico": "Grilled to order in approximately 15–20 min.",
  "Hambúrguer Especial": "Grilled to order in approximately 15–20 min.",
  "Coca-Cola": "Served chilled immediately.",
  Fanta: "Served chilled immediately.",
  Água: "Served chilled immediately.",
  Sumol: "Served chilled immediately.",
  Gelado: "Served immediately.",
  "Salada de Frutas": "Prepared fresh in approximately 10 min.",
} as const;

export type MenuPreparationName = keyof typeof menuPreparationsPt;

export function getMenuPreparation(name: string, language: "pt" | "en") {
  return (language === "en" ? menuPreparationsEn : menuPreparationsPt)[name as MenuPreparationName];
}
