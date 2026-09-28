import { criarCadastroSimples } from "./cadastro-simples.server";

export const contas = criarCadastroSimples({
	modelo: "contas",
	vinculos: [
		{ colecao: "despesas", campo: "conta" },
		{ colecao: "receitas", campo: "conta" },
	],
	rotulo: "conta",
});
