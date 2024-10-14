FROM node:22-alpine

COPY --chown=node:node . /app
WORKDIR /app
USER node
RUN npm install
RUN npm run build