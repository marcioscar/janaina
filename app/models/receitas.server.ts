import { db } from "~/db.server";
import type { Intervalo } from "~/lib/periodo";

// Receitas (entradas de dinheiro). Coleção nova e com datas sempre gravadas como Date,
// então o filtro por período usa o Prisma direto (despesas usa $runCommandRaw por causa
// de dados herdados do marcioscar).

export type Receita = {
	id: string;
	nome: string;
	categoria: string;
	valor: number;
	data: Date;
	conta: string;
	comprovante: string;
	obs: string;
};

export type DadosReceita = {
	nome: string;
	categoria: string;
	valor: number;
	data: Date;
	conta: string;
	comprovante?: string;
	obs?: string;
};

function obrigatorio(valor: string, campo: string): string {
	const texto = valor.trim();
	if (!texto) {
		throw new Error(`O campo "${campo}" e obrigatorio.`);
	}
	return texto;
}

function normalizar(dados: DadosReceita) {
	if (!Number.isFinite(dados.valor) || dados.valor <= 0) {
		throw new Error("Informe um valor valido maior que zero.");
	}
	return {
		nome: obrigatorio(dados.nome, "nome"),
		categoria: obrigatorio(dados.categoria, "categoria"),
		conta: obrigatorio(dados.conta, "conta"),
		valor: dados.valor,
		data: dados.data,
		comprovante: dados.comprovante?.trim() ?? "",
		obs: dados.obs?.trim() ?? "",
	};
}

const campos = {
	id: true,
	nome: true,
	categoria: true,
	valor: true,
	data: true,
	conta: true,
	comprovante: true,
	obs: true,
} as const;

export async function listarReceitas(periodo: Intervalo): Promise<Receita[]> {
	return db.receitas.findMany({
		where: { data: { gte: periodo.inicio, lte: periodo.fim } },
		orderBy: [{ data: "desc" }, { createdAt: "desc" }],
		select: campos,
	});
}

export async function criarReceita(dados: DadosReceita): Promise<void> {
	await db.receitas.create({ data: normalizar(dados) });
}

export async function atualizarReceita(id: string, dados: DadosReceita): Promise<void> {
	const resultado = await db.receitas.updateMany({ where: { id }, data: normalizar(dados) });
	if (resultado.count === 0) {
		throw new Error("Receita nao encontrada para edicao.");
	}
}

export async function excluirReceita(id: string): Promise<void> {
	const resultado = await db.receitas.deleteMany({ where: { id } });
	if (resultado.count === 0) {
		throw new Error("Receita nao encontrada para exclusao.");
	}
}
