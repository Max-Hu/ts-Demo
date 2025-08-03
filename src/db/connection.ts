import knex from 'knex';
import { logger } from '../utils/logger';

let db: knex.Knex;

export const initializeDatabase = async () => {
  try {
    db = knex({
      client: 'oracledb',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '1521'),
        user: process.env.DB_USER || 'scan_platform',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_SERVICE || 'XE',
        connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '1521'}/${process.env.DB_SERVICE || 'XE'}`
      },
      pool: {
        min: 2,
        max: parseInt(process.env.DB_CONNECTION_LIMIT || '10')
      },
      migrations: {
        directory: './src/db/migrations'
      },
      seeds: {
        directory: './src/db/seeds'
      }
    });

    // Test connection
    await db.raw('SELECT 1 FROM DUAL');
    logger.info('Database connection established successfully');

    // Run migrations
    await db.migrate.latest();
    logger.info('Database migrations completed');

    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const closeDatabase = async () => {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
}; 