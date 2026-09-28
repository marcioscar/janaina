/**
 * Lê uma variável de ambiente sem aspas em volta. O Portainer às vezes guarda o valor com as
 * aspas do .env (`"mongodb+srv://..."`), o que quebra quem usa o valor como veio.
 */
export function variavelAmbiente(nome: string): string | undefined {
	const valor = process.env[nome]?.trim().replace(/^(["'])(.*)\1$/, "$2");
	return valor || undefined;
}
