FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create entrypoint script
RUN cat > entrypoint.sh << 'EOF'
#!/bin/sh

echo "Waiting for database to be ready..."
sleep 3

echo "Running database migrations..."
npm run migrate

echo "Running database seeds..."
npm run seed

echo "Starting application..."
exec npm start
EOF

RUN chmod +x entrypoint.sh

EXPOSE 5000

CMD ["sh", "entrypoint.sh"]
