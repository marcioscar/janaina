import type { Route } from "./+types/protegido";
import { Outlet, redirect } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { MarcaHorizontal } from "~/components/marca";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { estaAutenticado } from "~/sessao.server";

/**
 * Layout de todas as páginas que exigem a senha (o login fica fora dele, em routes.ts).
 * O middleware roda em toda requisição dessas rotas, inclusive nas ações (criar, editar,
 * apagar) e nas requisições de dados que o navegador faz em /pagina.data.
 */
const exigirSenha: Route.MiddlewareFunction = async ({ request }) => {
  if (await estaAutenticado(request)) {
    return;
  }
  const voltar = caminhoParaVoltar(new URL(request.url));
  throw redirect(voltar === "/" ? "/login" : `/login?voltar=${encodeURIComponent(voltar)}`);
};

export const middleware: Route.MiddlewareFunction[] = [exigirSenha];

/** Caminho da página pedida, sem o sufixo `.data` e o `_routes` das requisições de dados. */
function caminhoParaVoltar(url: URL): string {
  let caminho = url.pathname.replace(/\.data$/, "");
  if (caminho === "/_root") caminho = "/";
  const busca = new URLSearchParams(url.search);
  busca.delete("_routes");
  const consulta = busca.toString();
  return consulta ? `${caminho}?${consulta}` : caminho;
}

export default function Protegido() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-14 items-center gap-2 border-b px-4'>
          <SidebarTrigger />
          <MarcaHorizontal mostrarApoio={false} className='md:hidden [&_svg]:size-7' />
        </header>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col p-4'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
