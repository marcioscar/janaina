import { Form, useActionData, useNavigation } from "react-router";
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
import { BOTAO_EDITAR_CLASS, BOTAO_NOVO_CLASS } from "~/lib/botoes";
import { CORES_CATEGORIA, corDaCategoria } from "~/lib/cores-categoria";
import type { ItemCadastro } from "~/models/cadastro-simples.server";

export type CadastroActionData = {
	ok: boolean;
	message: string;
	operacao: "criar" | "editar" | "excluir";
};

type Props = {
	/** Título da página, ex: "Categorias". */
	titulo: string;
	/** Rótulo em minúsculas, ex: "categoria". */
	rotulo: string;
	placeholder: string;
	itens: ItemCadastro[];
	/** Mostra a cor de cada item e deixa escolher outra na edição (categorias). */
	comCor?: boolean;
};

function parseString(raw: FormDataEntryValue | null): string {
	return typeof raw === "string" ? raw.trim() : "";
}

function getTituloErroOperacao(operacao: CadastroActionData["operacao"], rotulo: string): string {
	if (operacao === "editar") {
		return `Falha ao renomear ${rotulo}`;
	}

	if (operacao === "excluir") {
		return `Falha ao apagar ${rotulo}`;
	}

	return `Falha ao cadastrar ${rotulo}`;
}

/** Tela de cadastro de um campo só (nome): lista, adicionar, renomear e apagar. */
export function CadastroSimplesPage({ titulo, rotulo, placeholder, itens, comCor = false }: Props) {
	const actionData = useActionData<CadastroActionData>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";
	const submittingIntent = parseString(navigation.formData?.get("intent") ?? null);
	const [itemEmEdicao, setItemEmEdicao] = useState<ItemCadastro | null>(null);
	const novoItemFormRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (!actionData) {
			return;
		}

		if (actionData.ok) {
			toast.success(actionData.message);
			setItemEmEdicao(null);
			if (actionData.operacao === "criar") {
				novoItemFormRef.current?.reset();
			}
			return;
		}

		toast.error(getTituloErroOperacao(actionData.operacao, rotulo), {
			description: actionData.message,
		});
	}, [actionData, rotulo]);

	return (
		<main className='grid w-full max-w-3xl min-w-0 gap-4'>
			<div className='flex flex-wrap items-center gap-2'>
				<h1 className='text-2xl font-bold'>{titulo}</h1>
				<Badge variant='outline'>Total: {itens.length}</Badge>
			</div>

			<section className='rounded-md border'>
				<div className='border-b px-4 py-3'>
					<h2 className='text-lg font-semibold'>Nova {rotulo}</h2>
				</div>
				<Form
					ref={novoItemFormRef}
					method='post'
					className='flex flex-wrap items-center gap-2 p-4'>
					<input type='hidden' name='intent' value='criar' />
					<Input
						name='nome'
						placeholder={placeholder}
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
					<h2 className='text-lg font-semibold'>{titulo} cadastradas</h2>
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
								{itens.length > 0 ? (
									itens.map((item) => (
										<TableRow key={item.id}>
											<TableCell className='font-medium'>
												<span className='flex items-center gap-2.5'>
													{comCor && (
														<span
															aria-hidden
															className='size-3 shrink-0 rounded-full'
															style={{ background: corDaCategoria(item.cor) }}
														/>
													)}
													{item.nome}
												</span>
											</TableCell>
											<TableCell className='text-muted-foreground text-right tabular-nums'>
												{item.totalDespesas}
											</TableCell>
											<TableCell>
												<Button
													type='button'
													variant='outline'
													size='sm'
													className={BOTAO_EDITAR_CLASS}
													onClick={() => setItemEmEdicao(item)}>
													<PencilIcon />
													Editar
												</Button>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={3}>Nenhuma {rotulo} cadastrada.</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</section>

			<Dialog
				open={itemEmEdicao !== null}
				onOpenChange={(open) => !open && setItemEmEdicao(null)}>
				<DialogContent className='max-w-md'>
					<Form method='post' className='grid gap-4'>
						<input type='hidden' name='id' value={itemEmEdicao?.id ?? ""} />
						<DialogHeader>
							<DialogTitle>Editar {rotulo}</DialogTitle>
						</DialogHeader>

						<label className='grid gap-1 text-sm'>
							Nome
							<Input
								key={itemEmEdicao?.id}
								name='nome'
								required
								autoComplete='off'
								defaultValue={itemEmEdicao?.nome}
							/>
						</label>
						{comCor && (
							<fieldset className='grid gap-2 text-sm' key={`cor-${itemEmEdicao?.id}`}>
								<legend className='mb-2'>Cor</legend>
								<div className='flex flex-wrap gap-2'>
									{CORES_CATEGORIA.map(({ slot, nome }) => (
										<label key={slot} title={nome} className='cursor-pointer'>
											<input
												type='radio'
												name='cor'
												value={slot}
												defaultChecked={itemEmEdicao?.cor === slot}
												className='peer sr-only'
											/>
											<span className='sr-only'>{nome}</span>
											<span
												aria-hidden
												className='ring-offset-background peer-checked:ring-foreground peer-focus-visible:ring-ring block size-7 rounded-full ring-2 ring-transparent ring-offset-2 transition-shadow'
												style={{ background: corDaCategoria(slot) }}
											/>
										</label>
									))}
								</div>
							</fieldset>
						)}
						{itemEmEdicao && itemEmEdicao.totalDespesas > 0 && (
							<p className='text-muted-foreground text-xs'>
								As {itemEmEdicao.totalDespesas} despesa(s) desta {rotulo} passam a usar o
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
