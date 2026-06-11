# Repo-root Dockerfile for Railway — builds the app in trueline-journal/.
# Works with Railway's default settings (no Root Directory override needed).
# A copy scoped to trueline-journal/ exists for deployments that set
# Root Directory = trueline-journal; keep the two in sync.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY trueline-journal/ .

# Baked into the client bundle at build time. WARNING: anyone who can reach
# the deployed site can extract this key from the JS bundle — leave it unset
# for a public deployment (the app works, minus the AI coach).
ARG VITE_ANTHROPIC_API_KEY
ENV VITE_ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
RUN npm ci \
    && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/server ./server
RUN cd server && npm ci --omit=dev
COPY --from=build /app/dist ./dist

# server/index.mjs serves dist/ with SPA fallback, persists journal data
# under DATA_DIR (mount a volume there!), and proxies AI calls.
# Runtime env: PORT (Railway injects), APP_PASSCODE, DATA_DIR, ANTHROPIC_API_KEY.
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.mjs"]
