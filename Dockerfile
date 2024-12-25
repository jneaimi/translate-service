# Use the official Node.js image as a base
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
# This is done before copying the rest of the application files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Set environment variables for production (optional)
# ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
