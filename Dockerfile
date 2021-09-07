FROM node:14-alpine

WORKDIR /app
COPY . .

RUN apk update && apk add bash
RUN npm config set registry https://build-artifactory.eng.vmware.com/artifactory/api/npm/npm
RUN npm i -g npm
RUN npm i -g pm2
RUN npm ci

EXPOSE 7000
ENV NODE_ENV=production
CMD [ "pm2-runtime", "./src/app.js" ]