# P2P-Transfer

A P2P File Transfer Web App

## Build

Execute `build.sh`
```bash
./build.sh
```

The server folder will be generated
```bash
cd ./server
```

## Deployment

In server folder, install NodeJS dependencies
```bash
pnpm i -P
```

You can create a `.env` file to set config
```env
# Server port, default 3000
PORT=3000

# SSL switch, default false
SSL=false

# SSL certificate path
SSL_CERT=

# SSL key path
SSL_KEY=
```

After that, start server
```bash
node ./server.min.mjs
```

