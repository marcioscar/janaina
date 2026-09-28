import { categorias as cadastroCategorias } from "~/models/categorias.server";
import { listarDespesas } from "~/models/despesas.server";
import { listarReceitas } from "~/models/receitas.server";
import { CORES_CATEGORIA, slotValido } from "~/lib/cores-categoria";
import { intervaloDoMes, periodoAnterior, type Intervalo } from "~/lib/periodo";

export type TotalCategoria = {
	categoria: string;
	valor: number;
	quantidade: number;
	/** Slot de cor da categoria (null = neutro). */
	cor: number | null;
	/** Fração do total do período (0 a 1). */
	participacao: number;
};

/** Uma camada da pilha mensal: uma categoria com cor própria, ou "Outras". */
export type SerieMensal = {
	/** Chave do dado no gráfico (ex: "s3", "outras"). */
	chave: string;
	rotulo: string;
	/** Slot de cor; null = neutro ("Outras"). */
	cor: number | null;
};

export type TotalMes = {
	/** Primeiro dia do mês em ISO, para ordenar e formatar no cliente. */
	mes: string;
	valor: number;
	/** O mês em que o período selecionado termina. */
	destaque: boolean;
	/** Valor de cada série do mês, pela chave da série. */
	valores: Record<string, number>;
	/** Total de receitas do mês. */
	receitas: number;
};

export type ResumoDashboard = {
	/** Total de despesas do período. */
	total: number;
	quantidade: number;
	totalReceitas: number;
	quantidadeReceitas: number;
	totalPeriodoAnterior: number;
	porCategoria: TotalCategoria[];
	porMes: TotalMes[];
	/** Séries da pilha mensal, na ordem de empilhamento (de baixo para cima). */
	seriesMensais: SerieMensal[];
};

const MESES_NO_HISTORICO = 6;

function somar(despesas: { valor: number }[]): number {
	return despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
}

function chaveDoMes(data: Date): string {
	return intervaloDoMes(data).inicio.toISOString();
}

const CHAVE_OUTRAS = "outras";

/**
 * Escolhe as categorias que ganham camada própria no gráfico mensal: as que mais gastaram na
 * janela, até 7, sem repetir cor (duas categorias podem dividir um slot; a menor vai para
 * "Outras" para nenhum par de camadas ficar igual). O resto vira "Outras".
 * Retorna as séries na ordem da paleta, que é a ordem validada para cores vizinhas.
 */
function escolherSeries(
	totaisPorCategoria: Map<string, number>,
	cores: Record<string, number>,
): { series: SerieMensal[]; chavePorCategoria: Map<string, string> } {
	const maxProprias = CORES_CATEGORIA.length - 1;
	const slotsUsados = new Set<number>();
	const escolhidas: { categoria: string; cor: number }[] = [];

	for (const [categoria] of [...totaisPorCategoria.entries()].sort((a, b) => b[1] - a[1])) {
		const cor = cores[categoria];
		if (escolhidas.length >= maxProprias) break;
		if (!slotValido(cor) || slotsUsados.has(cor)) continue;
		slotsUsados.add(cor);
		escolhidas.push({ categoria, cor });
	}

	escolhidas.sort((a, b) => a.cor - b.cor);
	const series: SerieMensal[] = escolhidas.map(({ categoria, cor }) => ({
		chave: `s${cor}`,
		rotulo: categoria,
		cor,
	}));
	const chavePorCategoria = new Map(series.map((serie) => [serie.rotulo, serie.chave]));

	const temOutras = [...totaisPorCategoria.keys()].some((categoria) => !chavePorCategoria.has(categoria));
	if (temOutras) {
		series.push({ chave: CHAVE_OUTRAS, rotulo: "Outras", cor: null });
	}

	return { series, chavePorCategoria };
}

export async function obterResumoDashboard(periodo: Intervalo): Promise<ResumoDashboard> {
	const historico: Intervalo = {
		inicio: intervaloDoMes(periodo.fim, -(MESES_NO_HISTORICO - 1)).inicio,
		fim: intervaloDoMes(periodo.fim).fim,
	};

	const [despesas, despesasAnteriores, despesasHistorico, cores, receitas, receitasHistorico] =
		await Promise.all([
			listarDespesas(periodo),
			listarDespesas(periodoAnterior(periodo)),
			listarDespesas(historico),
			cadastroCategorias.mapaDeCores(),
			listarReceitas(periodo),
			listarReceitas(historico),
		]);

	const total = somar(despesas);

	const categorias = new Map<string, { valor: number; quantidade: number }>();
	for (const despesa of despesas) {
		const nome = despesa.categoria || "Sem categoria";
		const atual = categorias.get(nome) ?? { valor: 0, quantidade: 0 };
		categorias.set(nome, { valor: atual.valor + despesa.valor, quantidade: atual.quantidade + 1 });
	}
	const porCategoria = [...categorias.entries()]
		.map(([categoria, { valor, quantidade }]) => ({
			categoria,
			valor,
			quantidade,
			cor: cores[categoria] ?? null,
			participacao: total > 0 ? valor / total : 0,
		}))
		.sort((a, b) => b.valor - a.valor);

	const totaisHistorico = new Map<string, number>();
	for (const despesa of despesasHistorico) {
		const nome = despesa.categoria || "Sem categoria";
		totaisHistorico.set(nome, (totaisHistorico.get(nome) ?? 0) + despesa.valor);
	}
	const { series: seriesMensais, chavePorCategoria } = escolherSeries(totaisHistorico, cores);

	const meses = new Map<string, Record<string, number>>();
	for (let i = MESES_NO_HISTORICO - 1; i >= 0; i--) {
		meses.set(
			chaveDoMes(intervaloDoMes(periodo.fim, -i).inicio),
			Object.fromEntries(seriesMensais.map((serie) => [serie.chave, 0])),
		);
	}
	for (const despesa of despesasHistorico) {
		const valores = meses.get(chaveDoMes(despesa.data));
		if (!valores) continue;
		const chave = chavePorCategoria.get(despesa.categoria || "Sem categoria") ?? CHAVE_OUTRAS;
		valores[chave] = (valores[chave] ?? 0) + despesa.valor;
	}
	const receitasPorMes = new Map<string, number>();
	for (const receita of receitasHistorico) {
		const chave = chaveDoMes(receita.data);
		receitasPorMes.set(chave, (receitasPorMes.get(chave) ?? 0) + receita.valor);
	}

	const mesDestaque = chaveDoMes(periodo.fim);
	const porMes = [...meses.entries()].map(([mes, valores]) => ({
		mes,
		valor: Object.values(valores).reduce((acc, valor) => acc + valor, 0),
		destaque: mes === mesDestaque,
		valores,
		receitas: receitasPorMes.get(mes) ?? 0,
	}));

	return {
		total,
		quantidade: despesas.length,
		totalReceitas: somar(receitas),
		quantidadeReceitas: receitas.length,
		totalPeriodoAnterior: somar(despesasAnteriores),
		porCategoria,
		porMes,
		seriesMensais,
	};
}
