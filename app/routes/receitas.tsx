import type { Route } from "./+types/receitas";
import { Form, useActionData, useNavigation } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { ReceitaDialog, type ReceitaEditavel } from "~/components/receitas/receita-dialog";
import { BOTAO_RECEITA_CLASS } from "~/lib/botoes";
import { corDaCategoria } from "~/lib/cores-categoria";
import { formatarMoeda } from "~/lib/formato";
import { formatarDataInput, lerPeriodoDaUrl } from "~/lib/periodo";
import { categoriasReceita } from "~/models/categorias-receita.server";
import { contas as cadastroContas } from "~/models/contas.server";
import { uploadReciboAndGetUrl } from "~/models/pocketbase.server";
import {
	atualizarReceita,
	criarReceita,
	excluirReceita,
	listarReceitas,
} from "~/models/receitas.server";

type ActionData = {
	ok: boolean;
	message: string;
	operacao: "criar" | "editar" | "excluir";
};

function texto(raw: FormDataEntryValue | null): string {
	return typeof raw === "string" ? raw.trim() : "";
}

function dataDoFormulario(raw: FormDataEntryValue | null): Date {
	const valor = texto(raw);
	const data = new Date(`${valor}T00:00:00.000Z`);
	if (!valor || Number.isNaN(data.getTime())) {
		throw new Error("Informe a data da receita.");
	}
	return data;
}

async function uploadSeHouver(arquivo: FormDataEntryValue | null): Promise<string> {
	if (!(arquivo instanceof File) || arquivo.size === 0) {
		return "";
	}
	return uploadReciboAndGetUrl(Buffer.from(await arquivo.arrayBuffer()), arquivo.name);
}

function formatarData(iso: string): string {
	const [ano, mes, dia] = iso.slice(0, 10).split("-");
	return `${dia}/${mes}/${ano}`;
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Receitas | Janaina" },
		{ name: "description", content: "Cadastro e acompanhamento de receitas" },
	];
}

export async function loader({ request }: Route.LoaderArgs) {
	const periodo = lerPeriodoDaUrl(new URL(request.url));
	const [receitas, categorias, contas, cores] = await Promise.all([
		listarReceitas(periodo),
		categoriasReceita.listarNomes(),
		cadastroContas.listarNomes(),
		categoriasReceita.mapaDeCores(),
	]);

	return {
		receitas: receitas.map((receita) => ({
			...receita,
			data: receita.data.toISOString(),
			cor: cores[receita.categoria] ?? null,
		})),
		total: receitas.reduce((acc, receita) => acc + receita.valor, 0),
		categorias,
		contas,
		dataInicio: formatarDataInput(periodo.inicio),
		dataFim: formatarDataInput(periodo.fim),
	};
}

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
	let operacao: ActionData["operacao"] = "criar";
	try {
		const formData = await request.formData();
		operacao = (texto(formData.get("intent")) || "criar") as ActionData["operacao"];
		const id = texto(formData.get("id"));

		if (operacao === "excluir") {
			await excluirReceita(id);
			return { ok: true, message: "Receita apagada com sucesso.", operacao };
		}

		const comprovanteNovo = await uploadSeHouver(formData.get("comprovanteArquivo"));
		const dados = {
			nome: texto(formData.get("nome")),
			categoria: texto(formData.get("categoria")),
			valor: Number(formData.get("valor")),
			data: dataDoFormulario(formData.get("data")),
			conta: texto(formData.get("conta")),
			comprovante: comprovanteNovo || texto(formData.get("comprovanteAtual")),
			obs: texto(formData.get("obs")),
		};

		if (operacao === "editar") {
			await atualizarReceita(id, dados);
			return { ok: true, message: "Receita atualizada com sucesso.", operacao };
		}

		await criarReceita(dados);
		return { ok: true, message: "Receita lançada com sucesso.", operacao: "criar" };
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Erro inesperado.",
			operacao,
		};
	}
}

export default function Receitas({ loaderData }: Route.ComponentProps) {
	const { receitas, total, categorias, contas, dataInicio, dataFim } = loaderData;
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";
	const submittingIntent = texto(navigation.formData?.get("intent") ?? null);
	const [dialogAberto, setDialogAberto] = useState(false);
	const [emEdicao, setEmEdicao] = useState<ReceitaEditavel | null>(null);
	const [busca, setBusca] = useState("");

	const filtradas = useMemo(() => {
		const termo = busca.trim().toLowerCase();
		if (!termo) return receitas;
		return receitas.filter(
			(receita) =>
				receita.nome.toLowerCase().includes(termo) || receita.categoria.toLowerCase().includes(termo),
		);
	}, [receitas, busca]);

	useEffect(() => {
		if (!actionData) return;
		if (actionData.ok) {
			toast.success(actionData.message);
			setDialogAberto(false);
			return;
		}
		toast.error("Não foi possível salvar a receita", { description: actionData.message });
	}, [actionData]);

	function abrir(receita: ReceitaEditavel | null) {
		setEmEdicao(receita);
		setDialogAberto(true);
	}

	return (
		<main className='grid w-full min-w-0 gap-4'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div className='flex flex-wrap items-center gap-2'>
					<h1 className='text-2xl font-bold'>Receitas</h1>
					<Badge variant='outline'>Receitas: {receitas.length}</Badge>
					<Badge variant='outline'>Total: {formatarMoeda(total)}</Badge>
				</div>
				<Button variant='outline' className={BOTAO_RECEITA_CLASS} onClick={() => abrir(null)}>
					<PlusIcon />
					Lançar receita
				</Button>
			</div>

			<section className='rounded-md border'>
				<div className='border-b px-4 py-3'>
					<h2 className='text-lg font-semibold'>Receitas lançadas</h2>
				</div>
				<div className='border-b p-4'>
					<Form method='get' className='flex flex-wrap items-end gap-3'>
						<label className='grid gap-1 text-sm'>
							Data inicial
							<input
								type='date'
								name='dataInicio'
								defaultValue={dataInicio}
								key={`inicio-${dataInicio}`}
								className='border-input bg-background rounded-md border px-3 py-2'
							/>
						</label>
						<label className='grid gap-1 text-sm'>
							Data final
							<input
								type='date'
								name='dataFim'
								defaultValue={dataFim}
								key={`fim-${dataFim}`}
								className='border-input bg-background rounded-md border px-3 py-2'
							/>
						</label>
						<Button type='submit' variant='outline'>
							Aplicar filtro
						</Button>
					</Form>
				</div>
				<div className='grid gap-3 p-4'>
					<div className='flex flex-wrap items-center justify-between gap-2'>
						<Input
							value={busca}
							onChange={(event) => setBusca(event.target.value)}
							placeholder='Procurar por descrição ou categoria...'
							className='w-full sm:max-w-sm'
						/>
						<p className='text-muted-foreground text-sm'>{filtradas.length} receita(s)</p>
					</div>
					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Descrição</TableHead>
									<TableHead>Categoria</TableHead>
									<TableHead>Conta</TableHead>
									<TableHead className='text-right'>Valor</TableHead>
									<TableHead>Comprovante</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtradas.length > 0 ? (
									filtradas.map((receita) => (
										<TableRow
											key={receita.id}
											className='cursor-pointer'
											onClick={() => abrir(receita)}>
											<TableCell className='tabular-nums'>{formatarData(receita.data)}</TableCell>
											<TableCell>
												{/* Botão para abrir a edição também pelo teclado */}
												<button
													type='button'
													className='text-left hover:underline'
													onClick={(event) => {
														event.stopPropagation();
														abrir(receita);
													}}>
													{receita.nome}
												</button>
											</TableCell>
											<TableCell>
												<span className='flex items-center gap-2'>
													<span
														aria-hidden
														className='size-2.5 shrink-0 rounded-full'
														style={{ background: corDaCategoria(receita.cor) }}
													/>
													{receita.categoria}
												</span>
											</TableCell>
											<TableCell>{receita.conta}</TableCell>
											<TableCell className='text-right font-medium tabular-nums'>
												{formatarMoeda(receita.valor)}
											</TableCell>
											<TableCell>
												{receita.comprovante ? (
													<a
														href={receita.comprovante}
														target='_blank'
														rel='noreferrer'
														className='text-primary underline'
														onClick={(event) => event.stopPropagation()}>
														Abrir
													</a>
												) : (
													<span className='text-muted-foreground'>--</span>
												)}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6}>Nenhuma receita encontrada.</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</section>

			<ReceitaDialog
				open={dialogAberto}
				onOpenChange={setDialogAberto}
				receita={emEdicao}
				categorias={categorias}
				contas={contas}
				isSubmitting={isSubmitting}
				submittingIntent={submittingIntent}
			/>
		</main>
	);
}
