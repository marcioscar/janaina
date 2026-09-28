import type { Route } from "./+types/categorias";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	criarCategoria,
	excluirCategoria,
	listarCategorias,
	renomearCategoria,
	type CategoriaResumo,
} from "~/models/categorias.server";
import { BOTAO_EDITAR_CLASS, BOTAO_NOVO_CLASS } from "~/lib/botoes";

type ActionData = {
	ok: boolean;
	message: string;
	operacao: "criar" | "editar" | "excluir";
};

function parseString(raw: FormDataEntryValue | null): string {
	return typeof raw === "string" ? raw.trim() : "";
}

function getTituloErroOperacao(operacao: ActionData["operacao"]): string {
	if (operacao === "editar") {
		return "Falha ao renomear categoria";
	}

	if (operacao === "excluir") {
		return "Falha ao apagar categoria";
	}

	return "Falha ao cadastrar categoria";
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Categorias | Janaina" },
		{ name: "description", content: "Cadastro de categorias de despesa" },
	];
}

export async function loader() {
	return { categorias: await listarCategorias() };
}

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
	let intent: ActionData["operacao"] = "criar";

	try {
		const formData = await request.formData();
		intent = (parseString(formData.get("intent")) || "criar") as ActionData["operacao"];

		if (intent === "excluir") {
			await excluirCategoria(parseString(formData.get("id")));
			return { ok: true, message: "Categoria apagada com sucesso.", operacao: "excluir" };
		}

		if (intent === "editar") {
			await renomearCategoria(parseString(formData.get("id")), parseString(formData.get("nome")));
			return { ok: true, message: "Categoria atualizada com sucesso.", operacao: "editar" };
		}

		await criarCategoria(parseString(formData.get("nome")));
		return { ok: true, message: "Categoria cadastrada com sucesso.", operacao: "criar" };
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Erro inesperado.",
			operacao: intent,
		};
	}
}

export default function Categorias() {
	const { categorias } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";
	const submittingIntent = parseString(navigation.formData?.get("intent") ?? null);
	const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<CategoriaResumo | null>(null);
	const novaCategoriaFormRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (!actionData) {
			return;
		}

		if (actionData.ok) {
			toast.success(actionData.message);
			setCategoriaEmEdicao(null);
			if (actionData.operacao === "criar") {
				novaCategoriaFormRef.current?.reset();
			}
			return;
		}

		toast.error(getTituloErroOperacao(actionData.operacao), {
			description: actionData.message,
		});
	}, [actionData]);

	return (
		<main className='grid w-full max-w-3xl min-w-0 gap-4'>
			<div className='flex flex-wrap items-center gap-2'>
				<h1 className='text-2xl font-bold'>Categorias</h1>
				<Badge variant='outline'>Total: {categorias.length}</Badge>
			</div>

			<section className='rounded-md border'>
				<div className='border-b px-4 py-3'>
					<h2 className='text-lg font-semibold'>Nova categoria</h2>
				</div>
				<Form
					ref={novaCategoriaFormRef}
					method='post'
					className='flex flex-wrap items-center gap-2 p-4'>
					<input type='hidden' name='intent' value='criar' />
					<Input
						name='nome'
						placeholder='Ex: Supermercado'
						required
						autoComplete='off'
						className='w-full sm:max-w-sm'
					/>
					<Button
						type='submit'
						variant='outline'
						className={BOTAO_NOVO_CLASS}
						disabled={isSubmitting && submittingIntent === "criar"}>
						<PlusIcon />
						{isSubmitting && submittingIntent === "criar" ? "Salvando..." : "Adicionar"}
					</Button>
				</Form>
			</section>

			<section className='rounded-md border'>
				<div className='border-b px-4 py-3'>
					<h2 className='text-lg font-semibold'>Categorias cadastradas</h2>
				</div>
				<div className='p-4'>
					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nome</TableHead>
									<TableHead className='text-right'>Despesas</TableHead>
									<TableHead className='w-0' />
								</TableRow>
							</TableHeader>
							<TableBody>
								{categorias.length > 0 ? (
									categorias.map((categoria) => (
										<TableRow key={categoria.id}>
											<TableCell className='font-medium'>{categoria.nome}</TableCell>
											<TableCell className='text-muted-foreground text-right tabular-nums'>
												{categoria.totalDespesas}
											</TableCell>
											<TableCell>
												<Button
													type='button'
													variant='outline'
													size='sm'
													className={BOTAO_EDITAR_CLASS}
													onClick={() => setCategoriaEmEdicao(categoria)}>
													<PencilIcon />
													Editar
												</Button>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={3}>Nenhuma categoria cadastrada.</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</section>

			<Dialog
				open={categoriaEmEdicao !== null}
				onOpenChange={(open) => !open && setCategoriaEmEdicao(null)}>
				<DialogContent className='max-w-md'>
					<Form method='post' className='grid gap-4'>
						<input type='hidden' name='id' value={categoriaEmEdicao?.id ?? ""} />
						<DialogHeader>
							<DialogTitle>Editar categoria</DialogTitle>
						</DialogHeader>

						<label className='grid gap-1 text-sm'>
							Nome
							<Input
								key={categoriaEmEdicao?.id}
								name='nome'
								required
								autoComplete='off'
								defaultValue={categoriaEmEdicao?.nome}
							/>
						</label>
						{categoriaEmEdicao && categoriaEmEdicao.totalDespesas > 0 && (
							<p className='text-muted-foreground text-xs'>
								As {categoriaEmEdicao.totalDespesas} despesa(s) desta categoria passam a usar o
								novo nome.
							</p>
						)}

						<DialogFooter className='sm:justify-between'>
							<Button
								type='submit'
								name='intent'
								value='excluir'
								variant='destructive'
								formNoValidate
								disabled={isSubmitting}>
								{isSubmitting && submittingIntent === "excluir" ? "Apagando..." : "Apagar"}
							</Button>
							<DialogClose render={<Button type='button' variant='outline' />}>
								Cancelar
							</DialogClose>
							<Button
								type='submit'
								name='intent'
								value='editar'
								variant='outline'
								disabled={isSubmitting}>
								{isSubmitting && submittingIntent === "editar" ? "Salvando..." : "Salvar"}
							</Button>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>
		</main>
	);
}
