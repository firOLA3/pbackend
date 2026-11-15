import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  await connectDB();

  const app = createApp();

  const server = app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`🚀 PulseFit API server listening on http://0.0.0.0:${ENV.PORT}`);
    console.log(`📋 Health check: http://localhost:${ENV.PORT}/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

