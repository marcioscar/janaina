import { criarCadastroSimples } from "./cadastro-simples.server";

export const contas = criarCadastroSimples({
	modelo: "contas",
	campoDespesa: "conta",
	rotulo: "conta",
});
