import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Em produção o Traefik termina o HTTPS e repassa ao container por http, então a origem da
  // página (https://...) não bate com a URL que o servidor vê (http://...) e o React Router
  // recusa toda ação com 400 (proteção anti-CSRF). Liberamos só o domínio do próprio app
  // (o mesmo das regras Host(...) em deploy/portainer-stack.yml); qualquer outra origem
  // continua bloqueada.
  // O domínio antigo fica só durante a transição, até janaina.marcioscar.com.br propagar
  // (domínio .br registrado em 2026-09-28); depois pode ser removido daqui e da stack.
  allowedActionOrigins: ["janaina.marcioscar.com.br", "janaina.quattoracademia.com"],
} satisfies Config;
