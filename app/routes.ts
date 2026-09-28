import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("despesas", "routes/despesas.tsx"),
  route("categorias", "routes/categorias.tsx"),
  route("contas", "routes/contas.tsx"),
] satisfies RouteConfig;
