FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app /usr/src/app
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
