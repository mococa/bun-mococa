FROM oven/bun:1

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built dist folder from local machine
COPY ./dist ./dist

# Expose port
EXPOSE 3333/tcp

ENV ENV=production

# Run with .env file from mounted volume
ENTRYPOINT [ "bun", "--cwd=dist/", "--env-file=.env", "run", "main.js" ]