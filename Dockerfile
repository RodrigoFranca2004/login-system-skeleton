# Use the 'node:18-alpine' image as a base. 'alpine' is a lightweight Linux distro.
# We alias this stage as 'builder' to reference it later.
FROM node:18-alpine AS builder

# Set the working directory inside the container's filesystem
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json first.
# This leverages Docker's layer caching. These files change infrequently,
# so this layer will be cached unless dependencies change, speeding up future builds.
COPY package.json package-lock.json ./

# Install all dependencies, including 'devDependencies'
# 'devDependencies' are required here to run 'tsc' (TypeScript) and 'tsc-alias'.
RUN npm install

# Copy the entire project source code into the working directory
# This layer will change frequently, so it's placed after 'npm install'.
COPY . .

# Execute the 'build' script from package.json (e.g., "tsc && tsc-alias")
# This compiles TypeScript to JavaScript (in /dist) and resolves TS alias paths.
RUN npm run build

# Start from a fresh, identical base image.
# This ensures the final image doesn't contain any 'devDependencies' or source code.
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy the dependency manifests again for the production environment
COPY package.json package-lock.json ./

# Install ONLY production dependencies.
# '--omit=dev' (or '--production') skips 'devDependencies',
# resulting in a smaller and more secure 'node_modules' folder.
RUN npm install --omit=dev

# Copy only the compiled application code (the 'dist' folder)
# and the production 'node_modules' from the 'builder' stage.
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port that the application will run on.
# This is documentation for the user and a hint for Docker.
EXPOSE 3000

# Define the default command to run when the container starts.
# We run the compiled JavaScript file directly with Node.js.
# This is the entrypoint for the production container.
CMD [ "node", "dist/main.js" ]