# Backend

## Evironment variables

| Name        | Description                        | Default | Note                               |
| :---------- | :--------------------------------- | :-----: | :--------------------------------- |
| LOG_LEVEL   | Log level, number 0~5              |   `3`   | 0 for no log, 5 for log everything |
| PORT        | Server port                        | `3000`  |                                    |
| TLS         | Enable TLS while is `on`           |    -    |                                    |
| TLS_MIN_VER | TLS min version                    |    -    |                                    |
| TLS_MAX_VER | TLS max version                    |    -    |                                    |
| TLS_CERT    | TLS certificate path               |    -    | Required if TLS enabled            |
| TLS_KEY     | TLS key path                       |    -    | Required if TLS enabled            |
| AUTH        | Authorization header match content |    -    |                                    |

## Build

1. Install dependencies

```bash
# You can use other package managers
pnpm install
```

2. Execute build script

```bash
pnpm run build
```

3. Bundles are in `dist` directory

```txt
- dist
  +- server.esm.js
  `- server.esm.min.js
```

## Development

1. Install dependencies

```bash
# You can use other package managers
pnpm install
```

2. Start dev server

```bash
pnpm run dev
```
