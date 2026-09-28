import type { CadastroActionData } from "~/components/cadastro-simples-page";
import { db } from "~/db.server";

/**
 * Cadastros de um campo só (nome) cujo valor as despesas guardam como texto:
 * categorias -> despesas.categoria, contas -> despesas.conta.
 */
type Config = {
	/** Collection no Prisma. As duas têm o mesmo formato (id, nome, datas). */
	modelo: "categorias" | "contas";
	/** Campo de despesas que guarda o nome. */
	campoDespesa: "categoria" | "conta";
	/** Rótulo em minúsculas para mensagens, ex: "categoria". */
	rotulo: string;
};

export type ItemCadastro = {
	id: string;
	nome: string;
	totalDespesas: number;
};

function compararNome(a: string, b: string): number {
	return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function normalizarNome(nome: string): string {
	const texto = nome.trim().replace(/\s+/g, " ");
	if (!texto) {
		throw new Error('O campo "nome" e obrigatorio.');
	}
	return texto;
}

export function criarCadastroSimples({ modelo, campoDespesa, rotulo }: Config) {
	// Os dois delegates têm a mesma forma; o cast só unifica o tipo para o TypeScript.
	const tabela = db[modelo] as typeof db.categorias;
	const filtroDespesas = (nome: string) => ({ [campoDespesa]: nome });

	async function garantirNomeDisponivel(nome: string, ignorarId?: string) {
		const existentes = await tabela.findMany({ select: { id: true, nome: true } });
		const duplicado = existentes.find(
			(item) => item.id !== ignorarId && compararNome(item.nome, nome) === 0,
		);
		if (duplicado) {
			throw new Error(`Ja existe a ${rotulo} "${duplicado.nome}".`);
		}
	}

	async function buscar(id: string, acao: "edicao" | "exclusao") {
		const item = id ? await tabela.findUnique({ where: { id } }) : null;
		if (!item) {
			throw new Error(`${rotulo[0].toUpperCase()}${rotulo.slice(1)} nao encontrada para ${acao}.`);
		}
		return item;
	}

	return {
		/** Nomes em ordem alfabetica, para os campos de selecao. */
		async listarNomes(): Promise<string[]> {
			const itens = await tabela.findMany({ select: { nome: true } });
			return itens.map((item) => item.nome).sort(compararNome);
		},

		/** Itens com a quantidade de despesas que usam cada um. */
		async listar(): Promise<ItemCadastro[]> {
			const [itens, usos] = await Promise.all([
				tabela.findMany({ select: { id: true, nome: true } }),
				db.despesas.groupBy({ by: [campoDespesa], _count: { _all: true } }),
			]);
			const totalPorNome = new Map(
				usos.map((uso) => [(uso as Record<string, unknown>)[campoDespesa] as string, uso._count._all]),
			);

			return itens
				.map((item) => ({ ...item, totalDespesas: totalPorNome.get(item.nome) ?? 0 }))
				.sort((a, b) => compararNome(a.nome, b.nome));
		},

		async criar(nomeInformado: string): Promise<void> {
			const nome = normalizarNome(nomeInformado);
			await garantirNomeDisponivel(nome);
			await tabela.create({ data: { nome } });
		},

		/** Renomeia e atualiza as despesas que guardam o nome antigo. */
		async renomear(id: string, nomeInformado: string): Promise<void> {
			const nome = normalizarNome(nomeInformado);
			const atual = await buscar(id, "edicao");
			if (atual.nome === nome) {
				return;
			}

			await garantirNomeDisponivel(nome, id);
			await db.$transaction([
				tabela.update({ where: { id }, data: { nome } }),
				db.despesas.updateMany({ where: filtroDespesas(atual.nome), data: filtroDespesas(nome) }),
			]);
		},

		/** Só apaga itens sem despesas, para nenhuma despesa ficar apontando para um nome que sumiu. */
		async excluir(id: string): Promise<void> {
			const atual = await buscar(id, "exclusao");
			const emUso = await db.despesas.count({ where: filtroDespesas(atual.nome) });
			if (emUso > 0) {
				throw new Error(
					`A ${rotulo} "${atual.nome}" tem ${emUso} despesa(s). Troque a ${rotulo} delas antes de apagar.`,
				);
			}

			await tabela.delete({ where: { id } });
		},
	};
}

type CadastroSimples = ReturnType<typeof criarCadastroSimples>;

/** Action das telas de cadastro simples: despacha pelo campo `intent` do formulário. */
export async function executarAcaoCadastro(
	request: Request,
	cadastro: CadastroSimples,
	rotulo: string,
): Promise<CadastroActionData> {
	let operacao: CadastroActionData["operacao"] = "criar";

	try {
		const formData = await request.formData();
		const campo = (nome: string) => {
			const valor = formData.get(nome);
			return typeof valor === "string" ? valor.trim() : "";
		};
		operacao = (campo("intent") || "criar") as CadastroActionData["operacao"];
		const Rotulo = `${rotulo[0].toUpperCase()}${rotulo.slice(1)}`;

		if (operacao === "excluir") {
			await cadastro.excluir(campo("id"));
			return { ok: true, message: `${Rotulo} apagada com sucesso.`, operacao };
		}

		if (operacao === "editar") {
			await cadastro.renomear(campo("id"), campo("nome"));
			return { ok: true, message: `${Rotulo} atualizada com sucesso.`, operacao };
		}

		await cadastro.criar(campo("nome"));
		return { ok: true, message: `${Rotulo} cadastrada com sucesso.`, operacao: "criar" };
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Erro inesperado.",
			operacao,
		};
	}
}
