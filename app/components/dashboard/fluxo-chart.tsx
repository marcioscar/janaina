import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	type ChartConfig,
} from "~/components/ui/chart";
import { formatarMoeda } from "~/lib/formato";
import type { TotalMes } from "~/models/dashboard.server";

// Entradas x saídas por mês, lado a lado. Verde da marca para receitas e bordô/rosa do tema
// para despesas; o par passou no validador de paleta nos dois modos (separação para
// daltonismo e contraste >= 3:1 no card).
const chartConfig = {
	receitas: {
		label: "Receitas",
		theme: { light: "oklch(0.58 0.12 150)", dark: "oklch(0.72 0.1 155)" },
	},
	despesas: {
		label: "Despesas",
		theme: { light: "var(--chart-3)", dark: "var(--chart-1)" },
	},
} satisfies ChartConfig;

type LinhaFluxo = { mes: string; destaque: boolean; receitas: number; despesas: number };

function formatarMes(iso: string, formato: "curto" | "longo"): string {
	const texto = new Date(iso).toLocaleDateString("pt-BR", {
		month: formato === "curto" ? "short" : "long",
		year: formato === "curto" ? "2-digit" : "numeric",
		timeZone: "UTC",
	});
	return texto.replace(".", "").replace(" de ", "/");
}

/** Tooltip com receitas, despesas e o saldo do mês. */
function TooltipFluxo({ active, payload }: { active?: boolean; payload?: { payload?: LinhaFluxo }[] }) {
	const linha = payload?.[0]?.payload;
	if (!active || !linha) return null;
	const saldo = linha.receitas - linha.despesas;

	return (
		<div className='bg-popover text-popover-foreground ring-foreground/5 dark:ring-foreground/10 grid min-w-44 gap-1.5 rounded-xl px-2.5 py-2 text-xs shadow-lg ring-1'>
			<span className='font-medium'>{formatarMes(linha.mes, "longo")}</span>
			{(["receitas", "despesas"] as const).map((chave) => (
				<div key={chave} className='flex items-center gap-2'>
					<span aria-hidden className='h-3 w-1 shrink-0 rounded-full' style={{ background: `var(--color-${chave})` }} />
					<span className='text-muted-foreground flex-1'>{chartConfig[chave].label}</span>
					<span className='text-foreground font-medium tabular-nums'>{formatarMoeda(linha[chave])}</span>
				</div>
			))}
			<div className='mt-0.5 flex items-center justify-between gap-2 border-t pt-1.5'>
				<span className='text-muted-foreground'>Saldo</span>
				<span className='text-foreground font-semibold tabular-nums'>{formatarMoeda(saldo)}</span>
			</div>
		</div>
	);
}

export function FluxoChart({ meses }: { meses: TotalMes[] }) {
	const linhas: LinhaFluxo[] = meses.map((mes) => ({
		mes: mes.mes,
		destaque: mes.destaque,
		receitas: mes.receitas,
		despesas: mes.valor,
	}));

	return (
		<ChartContainer config={chartConfig} className='aspect-auto h-[280px] w-full'>
			<BarChart accessibilityLayer data={linhas} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barGap={4}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey='mes'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(mes: string) => formatarMes(mes, "curto")}
				/>
				<ChartTooltip cursor={false} content={<TooltipFluxo />} />
				<ChartLegend itemSorter={null} content={<ChartLegendContent />} />
				<Bar dataKey='receitas' fill='var(--color-receitas)' radius={[4, 4, 0, 0]} maxBarSize={24} />
				<Bar dataKey='despesas' fill='var(--color-despesas)' radius={[4, 4, 0, 0]} maxBarSize={24} />
			</BarChart>
		</ChartContainer>
	);
}
