FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

ENV REACT_APP_API_URL=http://backend:5000/api

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
