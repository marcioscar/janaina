// Cada categoria guarda um "slot" de cor (1 a 8) que aponta para --categoria-N em app.css.
// A cor pertence à categoria, e não à posição da barra: ela é a mesma em qualquer período e tela.

export const CORES_CATEGORIA = [
	{ slot: 1, nome: "Bordô" },
	{ slot: 2, nome: "Mel" },
	{ slot: 3, nome: "Petróleo" },
	{ slot: 4, nome: "Terracota" },
	{ slot: 5, nome: "Azul" },
	{ slot: 6, nome: "Rosa" },
	{ slot: 7, nome: "Verde" },
	{ slot: 8, nome: "Ameixa" },
] as const;

export function slotValido(slot: unknown): slot is number {
	return typeof slot === "number" && Number.isInteger(slot) && slot >= 1 && slot <= CORES_CATEGORIA.length;
}

/** Cor CSS de um slot; sem slot (ex: "Outras", categoria apagada) usa o neutro. */
export function corDaCategoria(slot?: number | null): string {
	return slotValido(slot) ? `var(--categoria-${slot})` : "var(--categoria-outras)";
}
