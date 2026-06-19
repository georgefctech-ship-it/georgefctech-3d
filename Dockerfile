# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package configurations and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source code and build the React SPA
COPY . .

# Argumentos de compilação para o Vite embutir no build estático
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# --- Production Stage ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
