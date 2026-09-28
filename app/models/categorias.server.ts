import { criarCadastroSimples } from "./cadastro-simples.server";

export const categorias = criarCadastroSimples({
	modelo: "categorias",
	campoDespesa: "categoria",
	rotulo: "categoria",
	comCor: true,
});
