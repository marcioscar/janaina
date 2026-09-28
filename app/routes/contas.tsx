import type { Route } from "./+types/contas";
import { CadastroSimplesPage } from "~/components/cadastro-simples-page";
import { executarAcaoCadastro } from "~/models/cadastro-simples.server";
import { contas } from "~/models/contas.server";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Contas | Janaina" },
		{ name: "description", content: "Cadastro de contas e cartões" },
	];
}

export async function loader() {
	return { itens: await contas.listar() };
}

export async function action({ request }: Route.ActionArgs) {
	return executarAcaoCadastro(request, contas, "conta");
}

export default function Contas({ loaderData }: Route.ComponentProps) {
	return (
		<CadastroSimplesPage
			titulo='Contas'
			rotulo='conta'
			placeholder='Ex: Cartão Nubank'
			itens={loaderData.itens}
			rotuloUsos='Lançamentos'
		/>
	);
}
