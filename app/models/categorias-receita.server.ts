import { criarCadastroSimples } from "./cadastro-simples.server";

export const categoriasReceita = criarCadastroSimples({
	modelo: "categoriasReceita",
	vinculos: [{ colecao: "receitas", campo: "categoria" }],
	rotulo: "categoria",
	comCor: true,
});
