// Main Server Entry Point
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
 
const server = app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`✓ Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`\n  API Health Check: http://localhost:${PORT}/api/health\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = server;
