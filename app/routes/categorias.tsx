import type { Route } from "./+types/categorias";
import { CadastroSimplesPage } from "~/components/cadastro-simples-page";
import { executarAcaoCadastro } from "~/models/cadastro-simples.server";
import { categorias } from "~/models/categorias.server";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Categorias | Janaina" },
		{ name: "description", content: "Cadastro de categorias de despesa" },
	];
}

export async function loader() {
	return { itens: await categorias.listar() };
}

export async function action({ request }: Route.ActionArgs) {
	return executarAcaoCadastro(request, categorias, "categoria");
}

export default function Categorias({ loaderData }: Route.ComponentProps) {
	return (
		<CadastroSimplesPage
			titulo='Categorias'
			rotulo='categoria'
			placeholder='Ex: Supermercado'
			itens={loaderData.itens}
		/>
	);
}
