# Base image
FROM node:20-alpine

# Work directory
WORKDIR /app

# Copy distribution to work directory
COPY ./dist /app

# Install dependences
RUN npm install --production

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
