# Build frontend
FROM node:jod-slim AS fe-base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY src-frontend /app/src-frontend
COPY \
  package.json pnpm-lock.yaml pnpm-workspace.yaml \
  postcss.config.ts rsbuild.config.ts tsconfig.json \
  /app/

FROM fe-base AS fe-build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN ls && pnpm run build

# Build backend
FROM rust:bookworm AS be-base
WORKDIR /app
RUN \
  echo "deb http://deb.debian.org/debian bookworm-backports main" > /etc/apt/sources.list.d/backports.list && \
  apt-get update && \
  apt-get install -y upx
COPY Cargo.lock Cargo.toml /app/
RUN echo "fn main() {}" > dummy.rs
RUN sed -i 's#src-backend/main.rs#dummy.rs#' Cargo.toml
RUN cargo build --release
RUN sed -i 's#dummy.rs#src-backend/main.rs#' Cargo.toml
COPY src-backend /app/src-backend

FROM be-base AS be-build
ARG TARGETPLATFORM
RUN cargo build --release
RUN upx --best --lzma -q -o /app/p2pt /app/target/release/p2pt

# Build final
FROM gcr.io/distroless/cc-debian12:latest
WORKDIR /app
COPY --from=fe-build /app/dist /app/dist
COPY --from=be-build /app/p2pt /app/p2pt
EXPOSE 8080
ENTRYPOINT [ "/app/p2pt" ]
