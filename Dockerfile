# Legacy base image and root runtime are intentional scanner findings.
FROM node:18-bullseye-slim

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Deliberately over-permissive permissions for a configuration finding.
RUN chmod -R 777 /app
USER root

EXPOSE 3000
CMD ["npm", "start"]
