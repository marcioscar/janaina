import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import { AppSidebar } from "~/components/app-sidebar";
import { MarcaHorizontal } from "~/components/marca";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { estaAutenticado } from "~/sessao.server";
import "./app.css";

const ROTAS_PUBLICAS = new Set(["/login"]);

/**
 * Tudo exige a senha, exceto /login. Fica no root para cobrir páginas e também ações
 * (criar, editar, apagar): proteger só os loaders deixaria os formulários abertos.
 */
const exigirSenha: Route.MiddlewareFunction = async ({ request }) => {
  const url = new URL(request.url);
  if (ROTAS_PUBLICAS.has(url.pathname)) {
    return;
  }
  if (!(await estaAutenticado(request))) {
    const voltar = url.pathname === "/" ? "" : `?voltar=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(`/login${voltar}`);
  }
};

export const middleware: Route.MiddlewareFunction[] = [exigirSenha];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // A tela de login ocupa a página toda, sem o menu lateral.
  if (ROTAS_PUBLICAS.has(useLocation().pathname)) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <MarcaHorizontal mostrarApoio={false} className="md:hidden [&_svg]:size-7" />
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
          <Outlet />
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
