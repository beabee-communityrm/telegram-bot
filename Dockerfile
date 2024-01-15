# Use the official Deno image from the Docker Hub
FROM denoland/deno:alpine

# Set the working directory in the Docker image
WORKDIR /app

# Copy the entire workspace to the working directory
COPY . .

# Change to the telegram-bot directory
WORKDIR /app/telegram-bot

# Download the dependencies
RUN deno cache main.ts --config deno.jsonc

# Compile the bot
# RUN deno task compile

# Run the bot
CMD ["deno", "task", "start"]