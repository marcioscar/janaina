import type { Route } from "./+types/login";
import { Form, redirect, useNavigation } from "react-router";
import { LockIcon } from "lucide-react";
import { MarcaIcone } from "~/components/marca";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	destinoSeguro,
	entrar,
	estaAutenticado,
	senhaCorreta,
	senhaEstaConfigurada,
} from "~/sessao.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Entrar | Janaina" }];
}

export async function loader({ request }: Route.LoaderArgs) {
	const destino = destinoSeguro(new URL(request.url).searchParams.get("voltar"));
	if (await estaAutenticado(request)) {
		throw redirect(destino);
	}
	return { destino, configurada: senhaEstaConfigurada() };
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const senha = formData.get("senha");
	const destino = destinoSeguro(String(formData.get("voltar") ?? ""));

	if (typeof senha === "string" && (await senhaCorreta(senha))) {
		return entrar(request, destino);
	}
	return { erro: "Senha incorreta." };
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const entrando = navigation.state !== "idle";

	return (
		<main className='bg-sidebar flex min-h-screen items-center justify-center p-4'>
			<div className='bg-card ring-foreground/5 grid w-full max-w-sm gap-6 rounded-2xl p-8 shadow-sm ring-1'>
				<div className='grid justify-items-center gap-3 text-center'>
					<MarcaIcone className='size-14' />
					<div className='font-brand leading-none'>
						<p className='text-2xl font-bold tracking-[-0.03em] text-(--marca-texto)'>janaina</p>
						<p className='mt-1 text-sm text-(--marca-apoio)'>finanças</p>
					</div>
				</div>

				{loaderData.configurada ? (
					<Form method='post' className='grid gap-3'>
						<input type='hidden' name='voltar' value={loaderData.destino} />
						<label className='grid gap-1.5 text-sm'>
							Senha
							<Input
								type='password'
								name='senha'
								required
								autoFocus
								autoComplete='current-password'
								aria-invalid={actionData?.erro ? true : undefined}
								aria-describedby={actionData?.erro ? "erro-senha" : undefined}
							/>
						</label>
						{actionData?.erro && (
							<p id='erro-senha' role='alert' className='text-destructive text-sm'>
								{actionData.erro}
							</p>
						)}
						<Button type='submit' disabled={entrando} className='mt-1'>
							<LockIcon />
							{entrando ? "Entrando..." : "Entrar"}
						</Button>
					</Form>
				) : (
					<p className='text-muted-foreground text-center text-sm'>
						O acesso ainda não foi configurado. Defina a variável <code>APP_SENHA</code> no servidor.
					</p>
				)}
			</div>
		</main>
	);
}
