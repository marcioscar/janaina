/**
 * Marca da Janaina (original em assets/jana). Bloco bordô com três barras em alta;
 * a moeda verde acima da maior é a meta sendo atingida.
 *
 * As cores vêm dos tokens --marca-* de app.css, então o logo troca sozinho no modo
 * escuro: o bloco vira rosa (o bordô sumiria no fundo escuro) e a moeda escurece.
 * Sobre o bordô a moeda usa o verde claro, porque o verde escuro some (2,2:1).
 */
import { cn } from "~/lib/utils";

type MarcaProps = { className?: string; title?: string };

export function MarcaIcone({ className, title = "Janaina finanças" }: MarcaProps) {
	return (
		<svg
			viewBox='0 0 64 64'
			fill='none'
			role='img'
			aria-label={title}
			className={cn("shrink-0", className)}>
			<rect width='64' height='64' rx='16' fill='var(--marca-bloco)' />
			<rect x='13' y='36' width='9' height='15' rx='3' fill='var(--marca-barras)' />
			<rect x='27.5' y='28' width='9' height='23' rx='3' fill='var(--marca-barras)' />
			<rect x='42' y='20' width='9' height='31' rx='3' fill='var(--marca-barras)' />
			<circle
				cx='46.5'
				cy='11.5'
				r='4.5'
				fill='var(--marca-moeda)'
				stroke='var(--marca-bloco)'
				strokeWidth='2'
			/>
		</svg>
	);
}

/** Ícone + "janaina / finanças", para a sidebar expandida. */
export function MarcaHorizontal({
	className,
	mostrarApoio = true,
}: {
	className?: string;
	mostrarApoio?: boolean;
}) {
	return (
		<span className={cn("inline-flex items-center gap-2.5", className)}>
			<MarcaIcone className='size-9' />
			<span className='font-brand flex flex-col leading-none'>
				<span className='text-[1.4rem] font-bold tracking-[-0.03em] text-(--marca-texto)'>
					janaina
				</span>
				{mostrarApoio && (
					<span className='mt-0.5 text-[0.7rem] text-(--marca-apoio)'>finanças</span>
				)}
			</span>
		</span>
	);
}
