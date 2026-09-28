import { criarCadastroSimples } from "./cadastro-simples.server";

export const categorias = criarCadastroSimples({
	modelo: "categorias",
	vinculos: [{ colecao: "despesas", campo: "categoria" }],
	rotulo: "categoria",
	comCor: true,
});
