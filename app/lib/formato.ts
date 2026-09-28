export function formatarMoeda(valor: number): string {
	return valor.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
}

/** Moeda abreviada para rótulos de gráfico: R$ 950, R$ 1,2 mil, R$ 3,4 mi. */
export function formatarMoedaCompacta(valor: number): string {
	return valor.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
		// Abaixo de mil só arredonda (R$ 958); acima abrevia com uma casa (R$ 1,2 mil).
		notation: Math.abs(valor) < 1000 ? "standard" : "compact",
		maximumFractionDigits: Math.abs(valor) < 1000 ? 0 : 1,
	});
}

export function formatarPercentual(fracao: number): string {
	return fracao.toLocaleString("pt-BR", {
		style: "percent",
		maximumFractionDigits: 1,
	});
}
