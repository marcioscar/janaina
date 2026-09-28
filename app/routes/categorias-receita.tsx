import type { Route } from "./+types/categorias-receita";
import { CadastroSimplesPage } from "~/components/cadastro-simples-page";
import { executarAcaoCadastro } from "~/models/cadastro-simples.server";
import { categoriasReceita } from "~/models/categorias-receita.server";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Categorias de receita | Janaina" },
		{ name: "description", content: "Cadastro de categorias de receita" },
	];
}

export async function loader() {
	return { itens: await categoriasReceita.listar() };
}

export async function action({ request }: Route.ActionArgs) {
	return executarAcaoCadastro(request, categoriasReceita, "categoria");
}

export default function CategoriasReceita({ loaderData }: Route.ComponentProps) {
	return (
		<CadastroSimplesPage
			titulo='Categorias de receita'
			rotulo='categoria'
			placeholder='Ex: Salário'
			itens={loaderData.itens}
			comCor
			rotuloUsos='Receitas'
		/>
	);
}
