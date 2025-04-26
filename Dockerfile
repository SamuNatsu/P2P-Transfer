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
FROM clux/muslrust:stable AS be-base
WORKDIR /app
RUN apt-get update && apt-get install -y upx
COPY Cargo.lock Cargo.toml /app/
RUN echo "fn main() {}" > dummy.rs
RUN sed -i 's#src-backend/main.rs#dummy.rs#' Cargo.toml
RUN cargo build --release
RUN sed -i 's#dummy.rs#src-backend/main.rs#' Cargo.toml
COPY src-backend /app/src-backend

FROM be-base AS be-build
ARG TARGETPLATFORM
RUN \
  cargo build --release && \
  upx --best --lzma -q /app/target/$(\
    [ "$TARGETPLATFORM" = "linux/amd64" ] && \
    echo x86_64-unknown-linux-musl || \
    echo aarch64-unknown-linux-musl\
  )/release/p2pt

# Build final
FROM scratch
COPY --from=fe-build /app/dist /dist
COPY --from=be-build /app/target/x86_64-unknown-linux-musl/release/p2pt /p2pt
EXPOSE 8080
CMD [ "/p2pt" ]
