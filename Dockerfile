# Base image
FROM node:20-alpine

# Environment variables
ENV NODE_ENV=production

# Work directory
WORKDIR /app

# Copy distribution to work directory
COPY ./server /app

# Install dependences
RUN npm install

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start:docker"]
