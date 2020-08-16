FROM node:14.8-slim
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD ["npm","run", "dev"]