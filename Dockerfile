# Build frontend
FROM node:24 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build Go backend
FROM golang:1.25 AS backend-build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/babelbridge main.go

# Final image
FROM alpine:3.19
WORKDIR /app
COPY --from=backend-build /app/babelbridge ./babelbridge
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY api/ ./api/
COPY backend/ ./babel/
COPY go.mod go.sum ./
ENV PORT=8080
EXPOSE 8080
CMD ["./babelbridge"]

