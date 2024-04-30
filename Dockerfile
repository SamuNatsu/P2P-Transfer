# Base image
FROM node:20-alpine

# Work directory
WORKDIR /app

# Copy distribution to work directory
COPY ./server /app

# Install dependences
RUN npm install --omit=dev

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start:docker"]
