import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { scanRoutes } from './api/routes/scanRoutes';
import { graphqlSchema } from './graphql/schema';
import { graphqlResolvers } from './graphql/resolvers';
import { initializeDatabase } from './db/connection';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// API Key authentication for protected routes
app.use('/api', apiKeyAuth);

// REST API routes
app.use('/api/scan', scanRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Setup GraphQL
    const schema = makeExecutableSchema({
      typeDefs: graphqlSchema,
      resolvers: graphqlResolvers
    });
    
    const server = new ApolloServer({
      schema,
      context: ({ req }) => ({ req }),
      playground: process.env.GRAPHQL_PLAYGROUND === 'true',
      introspection: process.env.NODE_ENV === 'development'
    });

    await server.start();
    server.applyMiddleware({ app, path: process.env.GRAPHQL_PATH || '/graphql' });

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`GraphQL endpoint: http://localhost:${PORT}${process.env.GRAPHQL_PATH || '/graphql'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 