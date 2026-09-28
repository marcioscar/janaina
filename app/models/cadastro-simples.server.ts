import type { CadastroActionData } from "~/components/cadastro-simples-page";
import { db } from "~/db.server";
import { CORES_CATEGORIA, slotValido } from "~/lib/cores-categoria";

/**
 * Cadastros de um campo só (nome) cujo valor os lançamentos guardam como texto:
 * categorias -> despesas.categoria, categoriasReceita -> receitas.categoria,
 * contas -> despesas.conta e receitas.conta.
 */
type Vinculo = {
	/** Collection de lançamentos que guarda o nome. */
	colecao: "despesas" | "receitas";
	campo: "categoria" | "conta";
};

type Config = {
	/** Collection no Prisma. Todas têm o mesmo formato (id, nome, datas; cor quando comCor). */
	modelo: "categorias" | "categoriasReceita" | "contas";
	/** Onde o nome é usado; renomear atualiza e apagar é bloqueado em todos. */
	vinculos: Vinculo[];
	/** Rótulo em minúsculas para mensagens, ex: "categoria". */
	rotulo: string;
	/** Guarda um slot de cor (1-8) por item. Só categorias têm o campo `cor`. */
	comCor?: boolean;
};

export type ItemCadastro = {
	id: string;
	nome: string;
	/** Slot de cor, ou null quando o cadastro não usa cor. */
	cor: number | null;
	/** Quantos lançamentos (em todos os vínculos) usam este nome. */
	totalUsos: number;
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

export function criarCadastroSimples({ modelo, vinculos, rotulo, comCor = false }: Config) {
	// Os dois delegates têm a mesma forma; o cast só unifica o tipo para o TypeScript.
	const tabela = db[modelo] as typeof db.categorias;
	// despesas e receitas têm categoria/conta com o mesmo tipo; o cast só unifica o delegate.
	const lancamentos = (colecao: Vinculo["colecao"]) => db[colecao] as typeof db.despesas;
	const filtro = (campo: Vinculo["campo"], nome: string) => ({ [campo]: nome });

	async function contarUsos(nome: string): Promise<number> {
		const totais = await Promise.all(
			vinculos.map(({ colecao, campo }) => lancamentos(colecao).count({ where: filtro(campo, nome) })),
		);
		return totais.reduce((acc, total) => acc + total, 0);
	}
	// Pedir `cor` numa collection que não tem o campo é erro no Prisma, então só quando comCor.
	const camposLista = { id: true, nome: true, ...(comCor ? { cor: true } : {}) } as const;

	/** Slot menos usado (empate: o menor), para categorias novas não repetirem cor à toa. */
	async function proximaCor(): Promise<number> {
		const itens = await tabela.findMany({ select: { cor: true } });
		const usos = CORES_CATEGORIA.map(({ slot }) => ({
			slot,
			total: itens.filter((item) => item.cor === slot).length,
		}));
		return usos.reduce((menor, atual) => (atual.total < menor.total ? atual : menor)).slot;
	}

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
			const [itens, ...usosPorVinculo] = await Promise.all([
				tabela.findMany({ select: camposLista }),
				...vinculos.map(({ colecao, campo }) =>
					lancamentos(colecao).groupBy({ by: [campo], _count: { _all: true } }),
				),
			]);
			const totalPorNome = new Map<string, number>();
			usosPorVinculo.forEach((usos, indice) => {
				const campo = vinculos[indice].campo;
				for (const uso of usos) {
					const nome = (uso as Record<string, unknown>)[campo] as string;
					totalPorNome.set(nome, (totalPorNome.get(nome) ?? 0) + uso._count._all);
				}
			});

			return itens
				.map((item) => ({
					id: item.id,
					nome: item.nome,
					cor: comCor ? (item.cor ?? null) : null,
					totalUsos: totalPorNome.get(item.nome) ?? 0,
				}))
				.sort((a, b) => compararNome(a.nome, b.nome));
		},

		async criar(nomeInformado: string): Promise<void> {
			const nome = normalizarNome(nomeInformado);
			await garantirNomeDisponivel(nome);
			await tabela.create({ data: { nome, ...(comCor ? { cor: await proximaCor() } : {}) } });
		},

		/** Renomeia (e troca a cor, se houver) e atualiza os lançamentos que guardam o nome antigo. */
		async renomear(id: string, nomeInformado: string, cor?: number): Promise<void> {
			const nome = normalizarNome(nomeInformado);
			const atual = await buscar(id, "edicao");
			const novaCor = comCor && slotValido(cor) && cor !== atual.cor ? cor : undefined;

			if (atual.nome === nome) {
				if (novaCor !== undefined) {
					await tabela.update({ where: { id }, data: { cor: novaCor } });
				}
				return;
			}

			await garantirNomeDisponivel(nome, id);
			await db.$transaction([
				tabela.update({ where: { id }, data: { nome, ...(novaCor !== undefined ? { cor: novaCor } : {}) } }),
				...vinculos.map(({ colecao, campo }) =>
					lancamentos(colecao).updateMany({ where: filtro(campo, atual.nome), data: filtro(campo, nome) }),
				),
			]);
		},

		/** Nome -> slot de cor, para colorir gráficos e listas. Vazio quando o cadastro não usa cor. */
		async mapaDeCores(): Promise<Record<string, number>> {
			if (!comCor) {
				return {};
			}
			const itens = await tabela.findMany({ select: { nome: true, cor: true } });
			return Object.fromEntries(
				itens.filter((item) => slotValido(item.cor)).map((item) => [item.nome, item.cor as number]),
			);
		},

		/** Só apaga itens sem lançamentos, para nenhum lançamento ficar apontando para um nome que sumiu. */
		async excluir(id: string): Promise<void> {
			const atual = await buscar(id, "exclusao");
			const emUso = await contarUsos(atual.nome);
			if (emUso > 0) {
				throw new Error(
					`A ${rotulo} "${atual.nome}" tem ${emUso} lançamento(s). Troque a ${rotulo} deles antes de apagar.`,
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
			await cadastro.renomear(campo("id"), campo("nome"), Number(campo("cor")) || undefined);
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
