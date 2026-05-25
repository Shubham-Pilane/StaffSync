FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies by copying package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
