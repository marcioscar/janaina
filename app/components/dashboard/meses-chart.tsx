import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, XAxis, type BarShapeProps } from "recharts";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	type ChartConfig,
} from "~/components/ui/chart";
import { corDaCategoria } from "~/lib/cores-categoria";
import { formatarMoeda, formatarMoedaCompacta } from "~/lib/formato";
import type { SerieMensal, TotalMes } from "~/models/dashboard.server";

// Colunas empilhadas por categoria. Cada camada usa a cor fixa da categoria; as séries chegam
// do servidor já sem cor repetida e na ordem da paleta (a ordem validada para cores vizinhas).
// Entre camadas há 2px da cor do card, que separam os segmentos sem desenhar borda.

type LinhaMes = Record<string, number | string | boolean> & {
	mes: string;
	destaque: boolean;
	total: number;
	/** Chave da camada mais alta com valor, que recebe o canto arredondado. */
	topo: string;
};

function formatarMes(iso: string, formato: "curto" | "longo"): string {
	const texto = new Date(iso).toLocaleDateString("pt-BR", {
		month: formato === "curto" ? "short" : "long",
		year: formato === "curto" ? "2-digit" : "numeric",
		timeZone: "UTC",
	});
	return texto.replace(".", "").replace(" de ", "/");
}

function montarLinhas(meses: TotalMes[], series: SerieMensal[]): LinhaMes[] {
	return meses.map((mes) => {
		const comValor = series.filter((serie) => (mes.valores[serie.chave] ?? 0) > 0);
		return {
			...mes.valores,
			mes: mes.mes,
			destaque: mes.destaque,
			total: mes.valor,
			topo: comValor.at(-1)?.chave ?? "",
		};
	});
}

/** O mês do período em negrito no eixo; os demais no tom secundário. */
function TickMes({
	x,
	y,
	payload,
	linhas,
}: {
	x?: number;
	y?: number;
	payload?: { value: string };
	linhas: LinhaMes[];
}) {
	if (!payload) return null;
	const destaque = linhas.find((linha) => linha.mes === payload.value)?.destaque;
	return (
		<text
			x={x}
			y={y}
			dy={12}
			textAnchor='middle'
			fontSize={12}
			className={destaque ? "fill-foreground font-semibold" : "fill-muted-foreground"}>
			{formatarMes(payload.value, "curto")}
		</text>
	);
}

/**
 * Tooltip do mês: total no topo e as categorias com gasto, de cima para baixo como na pilha.
 * Valor em destaque e nome em tom secundário; a marca colorida identifica a camada.
 */
function TooltipMes({
	active,
	payload,
	series,
}: {
	active?: boolean;
	payload?: { payload?: LinhaMes }[];
	series: SerieMensal[];
}) {
	const linha = payload?.[0]?.payload;
	if (!active || !linha) return null;
	const comValor = [...series].reverse().filter((serie) => Number(linha[serie.chave]) > 0);

	return (
		<div className='bg-popover text-popover-foreground ring-foreground/5 dark:ring-foreground/10 grid min-w-48 gap-1.5 rounded-xl px-2.5 py-2 text-xs shadow-lg ring-1'>
			<div className='flex items-baseline justify-between gap-4 font-medium'>
				<span>{formatarMes(linha.mes, "longo")}</span>
				<span className='text-foreground text-sm font-semibold'>{formatarMoeda(linha.total)}</span>
			</div>
			{comValor.map((serie) => (
				<div key={serie.chave} className='flex items-center gap-2'>
					<span
						aria-hidden
						className='h-3 w-1 shrink-0 rounded-full'
						style={{ background: corDaCategoria(serie.cor) }}
					/>
					<span className='text-muted-foreground flex-1'>{serie.rotulo}</span>
					<span className='text-foreground font-medium tabular-nums'>
						{formatarMoeda(Number(linha[serie.chave]))}
					</span>
				</div>
			))}
		</div>
	);
}

export function MesesChart({ meses, series }: { meses: TotalMes[]; series: SerieMensal[] }) {
	const linhas = montarLinhas(meses, series);
	const chartConfig: ChartConfig = Object.fromEntries(
		series.map((serie) => [serie.chave, { label: serie.rotulo, color: corDaCategoria(serie.cor) }]),
	);
	const ultimaSerie = series.at(-1)?.chave;

	return (
		<ChartContainer config={chartConfig} className='aspect-auto h-[340px] w-full'>
			<BarChart accessibilityLayer data={linhas} margin={{ top: 24, right: 4, bottom: 0, left: 4 }}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey='mes'
					tickLine={false}
					axisLine={false}
					tickMargin={4}
					interval={0}
					tick={<TickMes linhas={linhas} />}
				/>
				<ChartTooltip cursor={false} content={<TooltipMes series={series} />} />
				{/* Legenda na ordem da pilha (de baixo para cima), sem a ordenação alfabética padrão. */}
				<ChartLegend
					itemSorter={null}
					content={<ChartLegendContent className='flex-wrap gap-x-4 gap-y-1.5' />}
				/>
				{series.map((serie) => (
					<Bar
						key={serie.chave}
						dataKey={serie.chave}
						stackId='mes'
						fill={`var(--color-${serie.chave})`}
						stroke='var(--card)'
						strokeWidth={2}
						maxBarSize={40}
						shape={(props: BarShapeProps) => (
							<Rectangle
								{...props}
								radius={(props.payload as LinhaMes).topo === serie.chave ? [4, 4, 0, 0] : 0}
							/>
						)}>
						{serie.chave === ultimaSerie && (
							<LabelList
								dataKey='total'
								position='top'
								content={({ x, y, width, value, index }) => {
									const linha = typeof index === "number" ? linhas[index] : undefined;
									if (!Number(value) || !linha) return null;
									return (
										<text
											x={Number(x) + Number(width) / 2}
											y={Number(y) - 8}
											textAnchor='middle'
											fontSize={12}
											className={
												linha.destaque ? "fill-foreground font-semibold" : "fill-muted-foreground"
											}>
											{formatarMoedaCompacta(Number(value))}
										</text>
									);
								}}
							/>
						)}
					</Bar>
				))}
			</BarChart>
		</ChartContainer>
	);
}
