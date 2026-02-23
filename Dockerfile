# ──────────────────────────────────────────────────────────
# OptiKPI Smoke Test Automation — Docker image
# Base: Official Playwright image (includes browsers + deps)
# ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Set working directory
WORKDIR /app

# ── Install dependencies (layer-cached) ─────────────────
COPY package.json package-lock.json ./
RUN npm ci

# ── Install matching Chromium for the installed Playwright version ──
RUN npx playwright install --with-deps chromium

# ── Copy project source ─────────────────────────────────
COPY tsconfig.json extent-config.json ./
COPY config/        config/
COPY features/      features/
COPY scripts/       scripts/
COPY src/           src/
COPY data/          data/

# ── Patch extent report template (inline text + image popup) ─
RUN cp src/support/reporting/templates/step_logs_macro.njk \
      node_modules/cucumber-js-extent/extent/view/macros/step_logs_macro.njk

# ── Default environment ─────────────────────────────────
# Force headless mode inside the container (no display)
ENV HEADLESS=true
# Single-threaded by default; override with -e PARALLEL_THREADS=N
ENV PARALLEL_THREADS=4
# Set timezone to IST to match the OptiKPI app
ENV TZ=Asia/Kolkata
# Register ts-node ESM loader so Cucumber can import .ts formatters
ENV NODE_OPTIONS="--loader ts-node/esm --no-warnings"

# ── Entrypoint ──────────────────────────────────────────
CMD ["npm", "run", "test:parallel"]
