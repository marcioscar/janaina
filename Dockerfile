FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# O build não acessa o banco (`prisma generate` só lê o schema e o app é SSR),
# então basta um placeholder: a URL real entra em runtime e a senha não fica
# gravada nas camadas da imagem.
RUN DATABASE_URL=mongodb://build-placeholder npm run build

RUN npm prune --omit=dev

CMD ["npm", "run", "start"]
