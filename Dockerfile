# FROM node:20-alpine AS builder
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npx prisma generate
# RUN npm run build

# FROM node:20-alpine
# WORKDIR /usr/src/app
# COPY --from=builder /usr/src/app/dist ./dist
# COPY --from=builder /usr/src/app/generated ./generated
# COPY --from=builder /usr/src/app/node_modules ./node_modules
# COPY --from=builder /usr/src/app/package*.json ./
# COPY --from=builder /usr/src/app/prisma ./prisma
# RUN npm install --omit=dev
# EXPOSE 8080
# CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app

# Copia tutto il necessario dalla fase builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/generated ./generated
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/scripts/entrypoint.sh ./entrypoint.sh

# Rende eseguibile lo script
RUN chmod +x ./entrypoint.sh

RUN npm install --omit=dev

# Usa la porta corretta
EXPOSE 3000

# Entry point personalizzato
CMD ["./entrypoint.sh"]
