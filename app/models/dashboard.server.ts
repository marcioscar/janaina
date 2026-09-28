import { categorias as cadastroCategorias } from "~/models/categorias.server";
import { listarDespesas } from "~/models/despesas.server";
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

export type TotalMes = {
	/** Primeiro dia do mês em ISO, para ordenar e formatar no cliente. */
	mes: string;
	valor: number;
	/** O mês em que o período selecionado termina. */
	destaque: boolean;
};

export type ResumoDashboard = {
	total: number;
	quantidade: number;
	totalPeriodoAnterior: number;
	porCategoria: TotalCategoria[];
	porMes: TotalMes[];
};

const MESES_NO_HISTORICO = 6;

function somar(despesas: { valor: number }[]): number {
	return despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
}

function chaveDoMes(data: Date): string {
	return intervaloDoMes(data).inicio.toISOString();
}

export async function obterResumoDashboard(periodo: Intervalo): Promise<ResumoDashboard> {
	const historico: Intervalo = {
		inicio: intervaloDoMes(periodo.fim, -(MESES_NO_HISTORICO - 1)).inicio,
		fim: intervaloDoMes(periodo.fim).fim,
	};

	const [despesas, despesasAnteriores, despesasHistorico, cores] = await Promise.all([
		listarDespesas(periodo),
		listarDespesas(periodoAnterior(periodo)),
		listarDespesas(historico),
		cadastroCategorias.mapaDeCores(),
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

	const meses = new Map<string, number>();
	for (let i = MESES_NO_HISTORICO - 1; i >= 0; i--) {
		meses.set(chaveDoMes(intervaloDoMes(periodo.fim, -i).inicio), 0);
	}
	for (const despesa of despesasHistorico) {
		const chave = chaveDoMes(despesa.data);
		meses.set(chave, (meses.get(chave) ?? 0) + despesa.valor);
	}
	const mesDestaque = chaveDoMes(periodo.fim);
	const porMes = [...meses.entries()].map(([mes, valor]) => ({
		mes,
		valor,
		destaque: mes === mesDestaque,
	}));

	return {
		total,
		quantidade: despesas.length,
		totalPeriodoAnterior: somar(despesasAnteriores),
		porCategoria,
		porMes,
	};
}
