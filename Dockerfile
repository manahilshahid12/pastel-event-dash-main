# Deterministic build for Railway (and any Docker host).
# Installs ALL dependencies (incl. devDependencies needed to build),
# builds the TanStack Start Node server, then runs it.

FROM node:22-slim AS base
WORKDIR /app

# Install dependencies (force dev deps so vite/nitro are available to build)
COPY package.json package-lock.json ./
RUN npm install --include=dev

# Copy the rest of the source and build the Node server output (.output/)
COPY . .
RUN npm run build

# Runtime
ENV NODE_ENV=production
# Railway provides PORT at runtime; nitro's node-server listens on it.
CMD ["node", ".output/server/index.mjs"]
