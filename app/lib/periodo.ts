// Datas das despesas são gravadas à meia-noite UTC, então todo intervalo é montado em UTC.

export type Intervalo = { inicio: Date; fim: Date };

export function formatarDataInput(data: Date): string {
	return data.toISOString().slice(0, 10);
}

function inicioDoDia(ano: number, mes: number, dia: number): Date {
	return new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
}

function fimDoDia(ano: number, mes: number, dia: number): Date {
	return new Date(Date.UTC(ano, mes, dia, 23, 59, 59, 999));
}

/** Mês inteiro que contém `referencia`, deslocado em `deslocamento` meses. */
export function intervaloDoMes(referencia: Date, deslocamento = 0): Intervalo {
	const ano = referencia.getUTCFullYear();
	const mes = referencia.getUTCMonth() + deslocamento;
	return { inicio: inicioDoDia(ano, mes, 1), fim: fimDoDia(ano, mes + 1, 0) };
}

export function obterIntervaloMesAtual(): Intervalo {
	return intervaloDoMes(new Date());
}

export function parseDateFromSearchParam(
	value: string | null,
	tipo: "inicio" | "fim",
): Date | undefined {
	const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		return undefined;
	}

	const [, ano, mes, dia] = match.map(Number);
	const data =
		tipo === "fim" ? fimDoDia(ano, mes - 1, dia) : inicioDoDia(ano, mes - 1, dia);
	return Number.isNaN(data.getTime()) ? undefined : data;
}

/** Lê `?dataInicio=&dataFim=` (padrão: mês atual) e garante inicio <= fim. */
export function lerPeriodoDaUrl(url: URL): Intervalo {
	const mesAtual = obterIntervaloMesAtual();
	const inicio =
		parseDateFromSearchParam(url.searchParams.get("dataInicio"), "inicio") ?? mesAtual.inicio;
	const fim = parseDateFromSearchParam(url.searchParams.get("dataFim"), "fim") ?? mesAtual.fim;
	return inicio <= fim ? { inicio, fim } : { inicio: fim, fim: inicio };
}

/** Período de mesma duração imediatamente anterior, para comparação. */
export function periodoAnterior({ inicio, fim }: Intervalo): Intervalo {
	const duracao = fim.getTime() - inicio.getTime();
	const novoFim = new Date(inicio.getTime() - 1);
	return { inicio: new Date(novoFim.getTime() - duracao), fim: novoFim };
}

export type PresetPeriodo = { rotulo: string; dataInicio: string; dataFim: string };

export function presetsDePeriodo(hoje = new Date()): PresetPeriodo[] {
	const ano = hoje.getUTCFullYear();
	const paraPreset = (rotulo: string, { inicio, fim }: Intervalo): PresetPeriodo => ({
		rotulo,
		dataInicio: formatarDataInput(inicio),
		dataFim: formatarDataInput(fim),
	});

	return [
		paraPreset("Este mês", intervaloDoMes(hoje)),
		paraPreset("Mês passado", intervaloDoMes(hoje, -1)),
		paraPreset("Últimos 3 meses", {
			inicio: intervaloDoMes(hoje, -2).inicio,
			fim: intervaloDoMes(hoje).fim,
		}),
		paraPreset("Este ano", { inicio: inicioDoDia(ano, 0, 1), fim: fimDoDia(ano, 11, 31) }),
	];
}
