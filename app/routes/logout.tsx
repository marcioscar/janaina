import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { sair } from "~/sessao.server";

export async function action({ request }: Route.ActionArgs) {
	return sair(request);
}

// Visitar /logout direto só volta para o início; sair é sempre um POST (botão no menu).
export function loader() {
	return redirect("/");
}
