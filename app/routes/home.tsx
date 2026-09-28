import type { Route } from "./+types/home";
import { Form, Link, useNavigation } from "react-router";
import { MinusIcon, PlusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { CategoriasChart } from "~/components/dashboard/categorias-chart";
import { MesesChart } from "~/components/dashboard/meses-chart";
import { BOTAO_NOVO_CLASS } from "~/lib/botoes";
import { corDaCategoria } from "~/lib/cores-categoria";
import { formatarMoeda, formatarPercentual } from "~/lib/formato";
import { formatarDataInput, lerPeriodoDaUrl, presetsDePeriodo } from "~/lib/periodo";
import { cn } from "~/lib/utils";
import { obterResumoDashboard } from "~/models/dashboard.server";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Visão geral | Janaina" },
		{ name: "description", content: "Resumo das despesas por categoria e por mês" },
	];
}

export async function loader({ request }: Route.LoaderArgs) {
	const periodo = lerPeriodoDaUrl(new URL(request.url));
	const resumo = await obterResumoDashboard(periodo);

	return {
		...resumo,
		dataInicio: formatarDataInput(periodo.inicio),
		dataFim: formatarDataInput(periodo.fim),
		presets: presetsDePeriodo(),
	};
}

function formatarPeriodo(dataInicio: string, dataFim: string): string {
	const formatar = (iso: string) =>
		new Date(`${iso}T00:00:00Z`).toLocaleDateString("pt-BR", {
			day: "numeric",
			month: "short",
			year: "numeric",
			timeZone: "UTC",
		});
	return `${formatar(dataInicio)} – ${formatar(dataFim)}`;
}

function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
	if (anterior === 0) {
		return (
			<p className='text-muted-foreground text-sm'>Sem gastos no período anterior para comparar</p>
		);
	}

	const variacao = (atual - anterior) / anterior;
	const estavel = Math.abs(variacao) < 0.005;
	// Gastar mais é o lado ruim, então alta usa o tom de alerta e queda o de sucesso.
	const Icone = estavel ? MinusIcon : variacao > 0 ? TrendingUpIcon : TrendingDownIcon;
	const texto = estavel
		? "Igual ao período anterior"
		: `${formatarPercentual(Math.abs(variacao))} ${variacao > 0 ? "acima" : "abaixo"} do período anterior`;

	return (
		<p className='flex items-center gap-1.5 text-sm'>
			<Icone
				aria-hidden
				className={cn(
					"size-4",
					estavel ? "text-muted-foreground" : variacao > 0 ? "text-alerta" : "text-sucesso",
				)}
			/>
			<span className='text-foreground font-medium'>{texto}</span>
			<span className='text-muted-foreground'>({formatarMoeda(anterior)})</span>
		</p>
	);
}

function StatTile({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
	return (
		<Card size='sm'>
			<CardHeader>
				<CardDescription>{rotulo}</CardDescription>
				<CardTitle className='truncate text-2xl font-semibold'>{valor}</CardTitle>
				{detalhe && <p className='text-muted-foreground truncate text-sm'>{detalhe}</p>}
			</CardHeader>
		</Card>
	);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const {
		total,
		quantidade,
		totalPeriodoAnterior,
		porCategoria,
		porMes,
		seriesMensais,
		dataInicio,
		dataFim,
		presets,
	} = loaderData;
	const navigation = useNavigation();
	const carregando = navigation.state === "loading" && navigation.location.pathname === "/";
	const maiorCategoria = porCategoria[0];
	const presetAtivo = presets.find(
		(preset) => preset.dataInicio === dataInicio && preset.dataFim === dataFim,
	);

	return (
		<main className='grid w-full min-w-0 gap-6'>
			<div className='flex flex-wrap items-end justify-between gap-2'>
				<div className='grid gap-1'>
					<h1 className='text-2xl font-bold'>Visão geral</h1>
					<p className='text-muted-foreground text-sm'>{formatarPeriodo(dataInicio, dataFim)}</p>
				</div>
				<Button
					variant='outline'
					className={BOTAO_NOVO_CLASS}
					render={<Link to='/despesas' />}
					nativeButton={false}>
					<PlusIcon />
					Lançar despesa
				</Button>
			</div>

			{/* Filtro único acima de tudo que ele afeta: presets primeiro, intervalo livre depois. */}
			<div className='flex flex-wrap items-end gap-2'>
				<div className='bg-muted flex flex-wrap gap-1 rounded-lg p-1'>
					{presets.map((preset) => (
						<Button
							key={preset.rotulo}
							size='sm'
							variant={preset === presetAtivo ? "outline" : "ghost"}
							className={cn(preset === presetAtivo && "bg-background shadow-sm")}
							render={
								<Link
									to={`?dataInicio=${preset.dataInicio}&dataFim=${preset.dataFim}`}
									preventScrollReset
								/>
							}
							nativeButton={false}>
							{preset.rotulo}
						</Button>
					))}
				</div>
				<Form method='get' preventScrollReset className='flex flex-wrap items-end gap-2'>
					<input
						type='date'
						name='dataInicio'
						aria-label='Data inicial'
						defaultValue={dataInicio}
						key={`inicio-${dataInicio}`}
						className='border-input bg-background h-8 rounded-md border px-2 text-sm'
					/>
					<input
						type='date'
						name='dataFim'
						aria-label='Data final'
						defaultValue={dataFim}
						key={`fim-${dataFim}`}
						className='border-input bg-background h-8 rounded-md border px-2 text-sm'
					/>
					<Button type='submit' size='sm' variant='outline'>
						Aplicar
					</Button>
				</Form>
			</div>

			{/* Na troca de período os dados antigos ficam visíveis, esmaecidos, sem pular o layout. */}
			<div className={cn("grid gap-6 transition-opacity", carregando && "opacity-60")}>
				<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					<Card className='md:col-span-2'>
						<CardHeader>
							<CardDescription>Total gasto no período</CardDescription>
							<CardTitle className='text-5xl font-semibold tracking-tight'>
								{formatarMoeda(total)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Variacao atual={total} anterior={totalPeriodoAnterior} />
						</CardContent>
					</Card>
					<StatTile
						rotulo='Despesas lançadas'
						valor={quantidade.toLocaleString("pt-BR")}
						detalhe={quantidade > 0 ? `Média de ${formatarMoeda(total / quantidade)}` : undefined}
					/>
					<StatTile
						rotulo='Maior categoria'
						valor={maiorCategoria?.categoria ?? "—"}
						detalhe={
							maiorCategoria
								? `${formatarMoeda(maiorCategoria.valor)} · ${formatarPercentual(maiorCategoria.participacao)} do total`
								: undefined
						}
					/>
				</div>

				<div className='grid gap-4 lg:grid-cols-5'>
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>Despesas por categoria</CardTitle>
							<CardDescription>Quanto foi gasto em cada categoria no período</CardDescription>
						</CardHeader>
						<CardContent>
							{porCategoria.length > 0 ? (
								<div className='grid gap-4'>
									<CategoriasChart itens={porCategoria} />
									<details className='group text-sm'>
										<summary className='text-muted-foreground hover:text-foreground cursor-pointer select-none'>
											Ver como tabela
										</summary>
										<table className='mt-3 w-full'>
											<thead className='text-muted-foreground text-left text-xs'>
												<tr className='border-b'>
													<th className='py-2 font-medium'>Categoria</th>
													<th className='py-2 text-right font-medium'>Despesas</th>
													<th className='py-2 text-right font-medium'>%</th>
													<th className='py-2 text-right font-medium'>Valor</th>
												</tr>
											</thead>
											<tbody className='tabular-nums'>
												{porCategoria.map((item) => (
													<tr key={item.categoria} className='border-b last:border-0'>
														<td className='py-2'>
															<span className='flex items-center gap-2'>
																<span
																	aria-hidden
																	className='size-2.5 shrink-0 rounded-full'
																	style={{ background: corDaCategoria(item.cor) }}
																/>
																{item.categoria}
															</span>
														</td>
														<td className='text-muted-foreground py-2 text-right'>{item.quantidade}</td>
														<td className='text-muted-foreground py-2 text-right'>
															{formatarPercentual(item.participacao)}
														</td>
														<td className='py-2 text-right font-medium'>{formatarMoeda(item.valor)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</details>
								</div>
							) : (
								<div className='text-muted-foreground grid place-items-center gap-3 py-12 text-center text-sm'>
									<p>Nenhuma despesa neste período.</p>
									<Button variant='outline' size='sm' render={<Link to='/despesas' />} nativeButton={false}>
										Ir para despesas
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className='lg:col-span-3'>
						<CardHeader>
							<CardTitle>Últimos 6 meses</CardTitle>
							<CardDescription>Gasto por mês, dividido por categoria</CardDescription>
						</CardHeader>
						<CardContent>
							<MesesChart meses={porMes} series={seriesMensais} />
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
