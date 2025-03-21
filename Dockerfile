# Use the official nginx image
FROM nginx:alpine

# Copy your project files to the nginx HTML directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
