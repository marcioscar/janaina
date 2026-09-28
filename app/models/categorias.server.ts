import { db } from "~/db.server";

export type CategoriaResumo = {
	id: string;
	nome: string;
	totalDespesas: number;
};

function normalizarNome(nome: string): string {
	const texto = nome.trim().replace(/\s+/g, " ");
	if (!texto) {
		throw new Error('O campo "nome" e obrigatorio.');
	}
	return texto;
}

function compararNome(a: string, b: string): number {
	return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

async function garantirNomeDisponivel(nome: string, ignorarId?: string) {
	const existentes = await db.categorias.findMany({ select: { id: true, nome: true } });
	const duplicada = existentes.find(
		(categoria) => categoria.id !== ignorarId && compararNome(categoria.nome, nome) === 0,
	);
	if (duplicada) {
		throw new Error(`Ja existe a categoria "${duplicada.nome}".`);
	}
}

/** Nomes em ordem alfabetica, para os campos de selecao. */
export async function listarNomesCategorias(): Promise<string[]> {
	const categorias = await db.categorias.findMany({ select: { nome: true } });
	return categorias.map((categoria) => categoria.nome).sort(compararNome);
}

/** Categorias com a quantidade de despesas que usam cada uma. */
export async function listarCategorias(): Promise<CategoriaResumo[]> {
	const [categorias, usos] = await Promise.all([
		db.categorias.findMany({ select: { id: true, nome: true } }),
		db.despesas.groupBy({ by: ["categoria"], _count: { _all: true } }),
	]);
	const totalPorNome = new Map(usos.map((uso) => [uso.categoria, uso._count._all]));

	return categorias
		.map((categoria) => ({
			...categoria,
			totalDespesas: totalPorNome.get(categoria.nome) ?? 0,
		}))
		.sort((a, b) => compararNome(a.nome, b.nome));
}

export async function criarCategoria(nomeInformado: string): Promise<void> {
	const nome = normalizarNome(nomeInformado);
	await garantirNomeDisponivel(nome);
	await db.categorias.create({ data: { nome } });
}

/** Renomeia a categoria e atualiza as despesas que guardam o nome antigo. */
export async function renomearCategoria(id: string, nomeInformado: string): Promise<void> {
	const nome = normalizarNome(nomeInformado);
	const atual = await db.categorias.findUnique({ where: { id } });
	if (!atual) {
		throw new Error("Categoria nao encontrada para edicao.");
	}
	if (atual.nome === nome) {
		return;
	}

	await garantirNomeDisponivel(nome, id);
	await db.$transaction([
		db.categorias.update({ where: { id }, data: { nome } }),
		db.despesas.updateMany({ where: { categoria: atual.nome }, data: { categoria: nome } }),
	]);
}

/** Só apaga categorias sem despesas, para nenhuma despesa ficar com categoria orfa. */
export async function excluirCategoria(id: string): Promise<void> {
	const atual = await db.categorias.findUnique({ where: { id } });
	if (!atual) {
		throw new Error("Categoria nao encontrada para exclusao.");
	}

	const emUso = await db.despesas.count({ where: { categoria: atual.nome } });
	if (emUso > 0) {
		throw new Error(
			`A categoria "${atual.nome}" tem ${emUso} despesa(s). Troque a categoria delas antes de apagar.`,
		);
	}

	await db.categorias.delete({ where: { id } });
}
