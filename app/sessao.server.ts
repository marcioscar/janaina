import { createHash, timingSafeEqual } from "node:crypto";
import { createCookieSessionStorage, redirect } from "react-router";
import { variavelAmbiente } from "~/lib/env.server";

// Acesso por uma senha única (APP_SENHA), sem usuário. A sessão fica num cookie assinado;
// a chave de assinatura é derivada da própria senha, então trocar a senha derruba as sessões.

const UMA_SEMANA = 60 * 60 * 24 * 7;
const ESPERA_SENHA_ERRADA_MS = 1000;

function senhaConfigurada(): string | undefined {
	return variavelAmbiente("APP_SENHA");
}

function hash(texto: string): Buffer {
	return createHash("sha256").update(texto).digest();
}

type DadosSessao = { autenticado: boolean };

let armazenamento: ReturnType<typeof createCookieSessionStorage<DadosSessao>> | undefined;
let senhaDoArmazenamento: string | undefined;

function sessoes() {
	const senha = senhaConfigurada();
	if (!senha) {
		throw new Error("APP_SENHA nao configurada.");
	}
	if (!armazenamento || senhaDoArmazenamento !== senha) {
		senhaDoArmazenamento = senha;
		armazenamento = createCookieSessionStorage<DadosSessao>({
			cookie: {
				name: "janaina_sessao",
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
				maxAge: UMA_SEMANA,
				secrets: [hash(`janaina-sessao:${senha}`).toString("hex")],
			},
		});
	}
	return armazenamento;
}

export async function estaAutenticado(request: Request): Promise<boolean> {
	if (!senhaConfigurada()) {
		return false;
	}
	const sessao = await sessoes().getSession(request.headers.get("Cookie"));
	return sessao.get("autenticado") === true;
}

/** Compara em tempo constante; senha errada espera um pouco para atrasar tentativas em massa. */
export async function senhaCorreta(tentativa: string): Promise<boolean> {
	const senha = senhaConfigurada();
	const correta = !!senha && timingSafeEqual(hash(tentativa), hash(senha));
	if (!correta) {
		await new Promise((resolve) => setTimeout(resolve, ESPERA_SENHA_ERRADA_MS));
	}
	return correta;
}

export function senhaEstaConfigurada(): boolean {
	return !!senhaConfigurada();
}

/** Só aceita caminhos internos, para o parâmetro `voltar` não virar redirecionamento externo. */
export function destinoSeguro(destino: string | null): string {
	return destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";
}

export async function entrar(request: Request, destino: string) {
	const { getSession, commitSession } = sessoes();
	const sessao = await getSession(request.headers.get("Cookie"));
	sessao.set("autenticado", true);
	return redirect(destinoSeguro(destino), {
		headers: { "Set-Cookie": await commitSession(sessao) },
	});
}

export async function sair(request: Request) {
	if (!senhaConfigurada()) {
		return redirect("/login");
	}
	const { getSession, destroySession } = sessoes();
	const sessao = await getSession(request.headers.get("Cookie"));
	return redirect("/login", { headers: { "Set-Cookie": await destroySession(sessao) } });
}
