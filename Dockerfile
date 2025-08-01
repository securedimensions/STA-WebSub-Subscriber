FROM node:24.1-alpine
WORKDIR /app
COPY . .
RUN npm install
ENTRYPOINT [ "npm", "start" ]