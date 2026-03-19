# ──────────────────────────────────────────────────────────
# OptiKPI Smoke Test Automation — Optimized Docker image
# Single-stage build with Chromium-only + aggressive cleanup
# ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# ── Install dependencies + Chromium only (single RUN = fewer layers) ──
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && \
      npx playwright install --with-deps chromium && \
      # ── Cleanup: remove Firefox & WebKit browsers ──
      rm -rf /root/.cache/ms-playwright/firefox-* \
      /root/.cache/ms-playwright/webkit-* && \
      # ── Cleanup: npm cache ──
      npm cache clean --force && \
      # ── Cleanup: apt cache ──
      rm -rf /tmp/* /var/lib/apt/lists/* /var/cache/apt/* && \
      # ── Cleanup: prune node_modules junk ──
      find node_modules \( -name "*.md" -o -name "LICENSE" -o -name "LICENSE.*" \
      -o -name "CHANGELOG*" -o -name "*.map" -o -name "*.d.ts.map" \) \
      -type f -delete 2>/dev/null || true && \
      find node_modules \( -name ".github" -o -name "docs" -o -name "doc" \
      -o -name "example" -o -name "examples" -o -name "test" \
      -o -name "tests" -o -name "__tests__" -o -name ".nyc_output" \) \
      -type d -exec rm -rf {} + 2>/dev/null || true

# ── Copy project source (minimal files only) ─────────────
COPY tsconfig.json extent-config.json .env ./
COPY config/        config/
COPY features/      features/
COPY scripts/       scripts/
COPY src/           src/
COPY data/          data/

# ── Patch extent report template ─────────────────────────
RUN cp src/support/reporting/templates/step_logs_macro.njk \
      node_modules/cucumber-js-extent/extent/view/macros/step_logs_macro.njk

# ── Default environment ─────────────────────────────────
ENV HEADLESS=true
ENV PARALLEL_THREADS=4
ENV TZ=Asia/Kolkata
ENV NODE_OPTIONS="--loader ts-node/esm --no-warnings"

# ── Entrypoint ──────────────────────────────────────────
CMD ["npm", "run", "test:parallel"]
