FROM node:22-slim
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci
COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/server.js"]
