FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
# Install Alpine-specific native binaries
# RUN npm install @parcel/watcher-linux-x64-musl lightningcss-linux-x64-musl --force
# not a modification just needed to force install on alpine

RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app

# ADD THESE LINES HERE - BEFORE npm run build!
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--port", "3000"]