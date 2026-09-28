import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "~/components/ui/chart";
import { corDaCategoria } from "~/lib/cores-categoria";
import { formatarMoeda, formatarMoedaCompacta, formatarPercentual } from "~/lib/formato";
import type { TotalCategoria } from "~/models/dashboard.server";

// Cada barra usa a cor fixa da sua categoria (--categoria-N), a mesma em qualquer período e
// tela; "Outras" fica no neutro. O nome e o valor estão sempre escritos ao lado, então a cor
// ajuda a reconhecer a categoria mas nunca é o único jeito de identificá-la.
const chartConfig = {
	valor: { label: "Gasto" },
} satisfies ChartConfig;

const MAX_BARRAS = 8;
const ALTURA_POR_BARRA = 40;

/** Mantém as maiores categorias e junta o resto em "Outras", para não passar de 8 barras. */
function agruparCauda(itens: TotalCategoria[]): TotalCategoria[] {
	if (itens.length <= MAX_BARRAS) {
		return itens;
	}

	const principais = itens.slice(0, MAX_BARRAS - 1);
	const outras = itens.slice(MAX_BARRAS - 1).reduce(
		(acc, item) => ({
			...acc,
			valor: acc.valor + item.valor,
			quantidade: acc.quantidade + item.quantidade,
			participacao: acc.participacao + item.participacao,
		}),
		{ categoria: "Outras", valor: 0, quantidade: 0, cor: null, participacao: 0 } as TotalCategoria,
	);
	return [...principais, outras];
}

export function CategoriasChart({ itens }: { itens: TotalCategoria[] }) {
	const dados = agruparCauda(itens);
	const maiorNome = Math.max(...dados.map((item) => item.categoria.length));

	return (
		<ChartContainer
			config={chartConfig}
			className='aspect-auto w-full'
			style={{ height: dados.length * ALTURA_POR_BARRA + 8 }}>
			<BarChart
				accessibilityLayer
				data={dados}
				layout='vertical'
				margin={{ top: 4, right: 72, bottom: 4, left: 0 }}
				barCategoryGap={8}>
				<XAxis type='number' dataKey='valor' hide />
				<YAxis
					type='category'
					dataKey='categoria'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					width={Math.min(160, Math.max(72, maiorNome * 7.5))}
					className='text-sm'
				/>
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							hideIndicator
							formatter={(_valor, _nome, item) => {
								const dado = item.payload as TotalCategoria;
								return (
									<div className='grid gap-0.5'>
										<span className='text-foreground flex items-center gap-2 text-sm font-semibold'>
											<span
												aria-hidden
												className='h-3 w-1 rounded-full'
												style={{ background: corDaCategoria(dado.cor) }}
											/>
											{formatarMoeda(dado.valor)}
										</span>
										<span className='text-muted-foreground'>
											{formatarPercentual(dado.participacao)} do total ·{" "}
											{dado.quantidade} despesa(s)
										</span>
									</div>
								);
							}}
						/>
					}
				/>
				<Bar dataKey='valor' radius={[0, 4, 4, 0]} maxBarSize={24}>
					{dados.map((item) => (
						<Cell key={item.categoria} fill={corDaCategoria(item.cor)} />
					))}
					<LabelList
						dataKey='valor'
						position='right'
						offset={8}
						className='fill-foreground'
						fontSize={12}
						formatter={(valor) => formatarMoedaCompacta(Number(valor))}
					/>
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}
