FROM node:10
ENV PORT 8080
EXPOSE 8080
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
CMD ["npm", "start"]
