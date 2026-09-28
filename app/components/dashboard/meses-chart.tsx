import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "~/components/ui/chart";
import { formatarMoeda, formatarMoedaCompacta } from "~/lib/formato";
import type { TotalMes } from "~/models/dashboard.server";

// Ênfase: o mês do período no tom forte do tema, os anteriores num tom de contexto.
// O contexto tem pouco contraste com o card, por isso toda coluna leva o valor em cima.
const chartConfig = {
	destaque: {
		label: "Mês do período",
		theme: { light: "var(--chart-3)", dark: "var(--chart-1)" },
	},
	contexto: {
		label: "Meses anteriores",
		theme: { light: "var(--chart-1)", dark: "var(--chart-3)" },
	},
} satisfies ChartConfig;

function formatarMes(iso: string, formato: "curto" | "longo"): string {
	const texto = new Date(iso).toLocaleDateString("pt-BR", {
		month: formato === "curto" ? "short" : "long",
		year: formato === "curto" ? "2-digit" : "numeric",
		timeZone: "UTC",
	});
	return texto.replace(".", "").replace(" de ", "/");
}

export function MesesChart({ meses }: { meses: TotalMes[] }) {
	return (
		<ChartContainer config={chartConfig} className='aspect-auto h-[300px] w-full'>
			<BarChart accessibilityLayer data={meses} margin={{ top: 24, right: 4, bottom: 0, left: 4 }}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey='mes'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(mes: string) => formatarMes(mes, "curto")}
				/>
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							hideIndicator
							labelFormatter={(_rotulo, payload) => {
								const mes = payload?.[0]?.payload as TotalMes | undefined;
								return mes ? formatarMes(mes.mes, "longo") : null;
							}}
							formatter={(valor) => (
								<span className='text-foreground text-sm font-semibold'>
									{formatarMoeda(Number(valor))}
								</span>
							)}
						/>
					}
				/>
				<Bar dataKey='valor' radius={[4, 4, 0, 0]} maxBarSize={40}>
					{meses.map((mes) => (
						<Cell
							key={mes.mes}
							fill={mes.destaque ? "var(--color-destaque)" : "var(--color-contexto)"}
						/>
					))}
					<LabelList
						dataKey='valor'
						position='top'
						offset={8}
						className='fill-muted-foreground'
						fontSize={12}
						formatter={(valor) => (Number(valor) > 0 ? formatarMoedaCompacta(Number(valor)) : "")}
					/>
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}
