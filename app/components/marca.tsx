import { WalletIcon } from "lucide-react";
import { cn } from "~/lib/utils";

type Props = { className?: string };

/** Ícone da marca: carteira sobre um quadrado na cor primária. */
export function MarcaIcone({ className }: Props) {
	return (
		<span
			className={cn(
				"bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center rounded-lg",
				className,
			)}>
			<WalletIcon className='size-[55%]' />
		</span>
	);
}

/** Ícone + nome, para a sidebar expandida. */
export function MarcaHorizontal({ className }: Props) {
	return (
		<span className={cn("inline-flex items-center gap-2", className)}>
			<MarcaIcone className='size-8' />
			<span className='font-heading text-lg font-semibold tracking-tight'>
				Janaina
			</span>
		</span>
	);
}
