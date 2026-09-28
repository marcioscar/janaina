import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Públicas
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  // Exigem a senha (middleware em routes/protegido.tsx)
  layout("routes/protegido.tsx", [
    index("routes/home.tsx"),
    route("despesas", "routes/despesas.tsx"),
    route("receitas", "routes/receitas.tsx"),
    route("categorias", "routes/categorias.tsx"),
    route("categorias-receita", "routes/categorias-receita.tsx"),
    route("contas", "routes/contas.tsx"),
  ]),
] satisfies RouteConfig;
