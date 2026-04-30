# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- Runtime Stage ----------
FROM nginx:alpine

# remove default config
RUN rm /etc/nginx/conf.d/default.conf

# add custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]