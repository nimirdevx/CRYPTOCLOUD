# --- Stage 1: The "Builder" ---
# This container has all the tools to build your app
FROM node:lts-alpine AS builder
# Set the working directory
WORKDIR /app

# Copy package files and install dependencies (leverages cache)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the production app
RUN npm run build

# --- Stage 2: The "Production Server" ---
# This container is lightweight and only runs the built app
FROM node:lts-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the built assets from the "builder" stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port Next.js runs on
EXPOSE 3000

# The command to start the production server
CMD ["npm", "start"]