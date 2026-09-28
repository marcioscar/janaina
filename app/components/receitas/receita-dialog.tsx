import { useEffect, useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { SearchableComboboxField } from "~/components/despesas/searchable-combobox-field";

export type ReceitaEditavel = {
	id: string;
	nome: string;
	categoria: string;
	valor: number;
	/** Data em ISO. */
	data: string;
	conta: string;
	comprovante: string;
	obs: string;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Sem receita: cadastro de uma nova. Com receita: edição (e opção de apagar). */
	receita: ReceitaEditavel | null;
	categorias: string[];
	contas: string[];
	isSubmitting: boolean;
	submittingIntent?: string;
};

export function ReceitaDialog({
	open,
	onOpenChange,
	receita,
	categorias,
	contas,
	isSubmitting,
	submittingIntent,
}: Props) {
	const [categoria, setCategoria] = useState("");
	const [conta, setConta] = useState("");
	const editando = receita !== null;

	useEffect(() => {
		if (open) {
			setCategoria(receita?.categoria ?? "");
			setConta(receita?.conta ?? "");
		}
	}, [open, receita]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
				<Form
					method='post'
					encType='multipart/form-data'
					className='grid gap-4'
					key={receita?.id ?? "nova"}>
					{receita && <input type='hidden' name='id' value={receita.id} />}
					{receita && <input type='hidden' name='comprovanteAtual' value={receita.comprovante} />}

					<DialogHeader>
						<DialogTitle>{editando ? "Editar receita" : "Lançar receita"}</DialogTitle>
					</DialogHeader>

					<div className='grid gap-3 md:grid-cols-2'>
						<label className='grid gap-1 text-sm'>
							Descrição
							<Input type='text' name='nome' required defaultValue={receita?.nome} />
						</label>

						<SearchableComboboxField
							label='Categoria'
							name='categoria'
							placeholder='Selecione uma categoria'
							options={categorias}
							value={categoria}
							onValueChange={setCategoria}
							required
							disabled={isSubmitting}
						/>

						<label className='grid gap-1 text-sm'>
							Valor (R$)
							<Input
								type='number'
								name='valor'
								step='0.01'
								min='0.01'
								required
								defaultValue={receita?.valor}
							/>
						</label>

						<label className='grid gap-1 text-sm'>
							Data
							<Input type='date' name='data' required defaultValue={receita?.data.slice(0, 10)} />
						</label>

						<SearchableComboboxField
							label='Conta'
							name='conta'
							placeholder='Onde o dinheiro entrou'
							options={contas}
							value={conta}
							onValueChange={setConta}
							required
							disabled={isSubmitting}
						/>

						<label className='grid gap-1 text-sm'>
							{editando ? "Novo comprovante (opcional)" : "Comprovante (opcional)"}
							<Input type='file' name='comprovanteArquivo' accept='.pdf,.jpg,.jpeg,.png,.webp,.gif' />
						</label>

						<label className='grid gap-1 text-sm md:col-span-2'>
							Observação
							<Textarea name='obs' rows={3} defaultValue={receita?.obs ?? ""} />
						</label>
					</div>

					<DialogFooter className={editando ? "sm:justify-between" : undefined}>
						{editando && (
							<Button
								type='submit'
								name='intent'
								value='excluir'
								variant='destructive'
								formNoValidate
								disabled={isSubmitting}>
								{isSubmitting && submittingIntent === "excluir" ? "Apagando..." : "Apagar receita"}
							</Button>
						)}
						<DialogClose render={<Button type='button' variant='outline' />}>Cancelar</DialogClose>
						<Button
							type='submit'
							name='intent'
							value={editando ? "editar" : "criar"}
							variant='outline'
							disabled={isSubmitting}>
							{isSubmitting && submittingIntent !== "excluir" ? "Salvando..." : "Salvar receita"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
