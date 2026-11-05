# ---- PureMeds Backend (Application Tier) ----
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8000

# Install only production dependencies (hardhat etc. are devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY public ./public

# CA bundle needed to connect to Amazon DocumentDB over TLS
RUN wget -q -O /app/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    && mkdir -p public/temp \
    && chown -R node:node /app

# Never run as root inside the container
USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8000/ || exit 1

CMD ["node", "src/index.js"]
