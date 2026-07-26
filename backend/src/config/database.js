const mysql = require('mysql2');
const logger = require('./logger');
require('dotenv').config();

// Create MySQL connection pool
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0
// });

const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: isProduction
    ? {
        rejectUnauthorized: false
      }
    : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});


// Get promise-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    logger.info('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed: ' + error.message);
    return false;
  }
};

module.exports = {
  pool,
  promisePool,
  testConnection
};
