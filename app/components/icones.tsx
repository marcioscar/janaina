// Ícones do app financeiro da Janaina (original em assets/jana/icons.jsx) — 24x24,
// traço de 1.75, herdam a cor via currentColor. O lucide do app usa o mesmo traço (app.css).
// Uso: <IconMeta className="size-5" />  ou  <IconMeta title="Metas" /> quando o ícone estiver sozinho.
import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
  title?: string;
};

function createIcon(displayName: string, children: ReactNode) {
  function Icon({ size = 24, strokeWidth = 1.75, title, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        {...props}
      >
        {title && <title>{title}</title>}
        {children}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

const solid = { fill: "currentColor", stroke: "none" };

/* ---------- Navegação ---------- */
export const IconInicio = createIcon("IconInicio", <path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2z" />);
export const IconPainel = createIcon("IconPainel", <>
  <rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" />
  <rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" />
</>);
export const IconTransacoes = createIcon("IconTransacoes", <path d="M7 20V4M4 7l3-3 3 3M17 4v16m-3-3 3 3 3-3" />);
export const IconDesempenho = createIcon("IconDesempenho", <>
  <path d="M3 3v18h18" /><path d="m7 15 3-4 3 2 5-6" /><circle cx="18" cy="7" r="1.8" {...solid} />
</>);
export const IconCalendario = createIcon("IconCalendario", <>
  <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
</>);
export const IconAlertas = createIcon("IconAlertas", <path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0" />);
export const IconPerfil = createIcon("IconPerfil", <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>);
export const IconAjustes = createIcon("IconAjustes", <>
  <path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" />
</>);

/* ---------- Dinheiro ---------- */
export const IconReceita = createIcon("IconReceita", <><circle cx="12" cy="12" r="9" /><path d="M12 16V8m-3.5 3.5L12 8l3.5 3.5" /></>);
export const IconDespesa = createIcon("IconDespesa", <><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-3.5-3.5L12 16l3.5-3.5" /></>);
export const IconCarteira = createIcon("IconCarteira", <>
  <rect x="3" y="5" width="18" height="15" rx="2" /><path d="M21 10h-4.5a2.5 2.5 0 0 0 0 5H21" /><circle cx="16.5" cy="12.5" r="0.9" {...solid} />
</>);
export const IconCartao = createIcon("IconCartao", <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>);
export const IconOrcamento = createIcon("IconOrcamento", <>
  <circle cx="12" cy="12" r="9" /><path d="M12 3v9l6.4 6.4" />
</>);
export const IconReserva = createIcon("IconReserva", <>
  {/* cofre: reserva de emergência */}
  <rect x="3" y="4" width="18" height="15" rx="2" /><circle cx="12" cy="11.5" r="3.5" /><path d="M12 8v1.5M7 19v1.5M17 19v1.5" />
</>);
export const IconInvestimentos = createIcon("IconInvestimentos", <>
  {/* pilha de moedas com seta de alta */}
  <rect x="3" y="16" width="10" height="4" rx="2" /><rect x="3" y="12" width="10" height="4" rx="2" /><rect x="3" y="8" width="10" height="4" rx="2" />
  <path d="m15 15 6-6M17 9h4v4" />
</>);
export const IconMeta = createIcon("IconMeta", <>
  {/* bandeira quadriculada de chegada */}
  <path d="M5 21V4h13v9H5" /><path d="M5 8.5h13M9.33 4v9M13.66 4v9" />
</>);
export const IconVencimentos = createIcon("IconVencimentos", <>
  {/* cronômetro: contas recorrentes */}
  <circle cx="12" cy="14" r="7" /><path d="M12 14v-3.5M10 3h4M12 3v4M18.5 7.5 20 6" />
</>);

export const IconCategoria = createIcon("IconCategoria", <>
  {/* etiqueta: cadastro de categorias */}
  <path d="M3 12.2V5a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L3.6 13.6a2 2 0 0 1-.6-1.4z" /><circle cx="8" cy="8" r="1.4" {...solid} />
</>);

/* ---------- Categorias ---------- */
export const IconCorrida = createIcon("IconCorrida", <>
  <path d="M3 16c0-2.4.6-4.6 1.8-6.6l.7-1.2c.3-.5 1-.7 1.5-.3 1.2.9 2.8 1 3.9.2l.6-.5c.5-.3 1.1-.2 1.3.3l.9 2c.8 1.7 2.4 2.8 4.3 3l.8.1c1.4.2 2.5 1.4 2.5 2.8V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
  <path d="M3 15.5h18.5M9.3 10.3l1.5-.9M10.8 12.3l1.5-.9" />
</>);
export const IconVinho = createIcon("IconVinho", <>
  <path d="M7 3h10l-.5 4a4.5 4.5 0 0 1-9 0z" /><path d="M7.4 6h9.2" /><path d="M12 11.5V20M8.5 21h7" />
</>);
export const IconViagem = createIcon("IconViagem", <path d="M12 2c1 0 1.5 1 1.5 2.5V9l7.5 4.5V16l-7.5-2.5V18l2.5 2v1.5L12 20.5l-4 1V20l2.5-2v-4.5L3 16v-2.5L10.5 9V4.5C10.5 3 11 2 12 2z" />);
export const IconMala = createIcon("IconMala", <>
  <rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 7v13M15 7v13" />
</>);
export const IconDestino = createIcon("IconDestino", <><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></>);
export const IconCambio = createIcon("IconCambio", <>
  <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
</>);

/* ---------- Ações ---------- */
export const IconAdicionar = createIcon("IconAdicionar", <path d="M12 5v14M5 12h14" />);
export const IconBuscar = createIcon("IconBuscar", <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>);

export const icons = {
  inicio: IconInicio, painel: IconPainel, transacoes: IconTransacoes, desempenho: IconDesempenho,
  calendario: IconCalendario, alertas: IconAlertas, perfil: IconPerfil, ajustes: IconAjustes,
  receita: IconReceita, despesa: IconDespesa, carteira: IconCarteira, cartao: IconCartao,
  orcamento: IconOrcamento, categoria: IconCategoria, reserva: IconReserva, investimentos: IconInvestimentos, meta: IconMeta,
  vencimentos: IconVencimentos, corrida: IconCorrida, vinho: IconVinho, viagem: IconViagem,
  mala: IconMala, destino: IconDestino, cambio: IconCambio, adicionar: IconAdicionar, buscar: IconBuscar,
};
