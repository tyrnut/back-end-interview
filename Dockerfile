FROM node:22-alpine

COPY --chown=node:node . /app
WORKDIR /app
USER node
RUN npm install
RUN npm run build

FROM node:22-alpine
COPY --from=0 --chown=node:node /app/dist /app
COPY --from=0 --chown=node:node /app/node_modules /app/node_modules
WORKDIR /app
USER node
EXPOSE 3000
CMD [ "node", "main.js" ]