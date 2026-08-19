FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production PORT=80

COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public ./public

USER node
EXPOSE 80
CMD ["node", "server.js"]
