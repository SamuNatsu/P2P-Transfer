# Base image
FROM node:20-alpine

# Environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Work directory
WORKDIR /app

# Copy distribution to work directory
COPY ./server /app

# Install dependences
RUN npm install

# Start command
CMD ["npm", "run", "start:docker"]
