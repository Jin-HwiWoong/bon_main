FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/entities/package.json packages/entities/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN npm ci

FROM deps AS builder

WORKDIR /app

COPY . .

RUN npm run build:backend

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/entities/package.json packages/entities/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/entities/dist ./packages/entities/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations

EXPOSE 4000

CMD ["node", "apps/backend/dist/main.js"]
