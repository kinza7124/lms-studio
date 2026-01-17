/**
 * Database Transaction Utility
 * 
 * Provides a helper function to execute database operations within a transaction.
 * If any operation fails, all changes are rolled back automatically.
 * 
 * Usage:
 *   await withTransaction(async (client) => {
 *     await client.query('INSERT INTO ...');
 *     await client.query('UPDATE ...');
 *     // If any query fails, all changes are rolled back
 *   });
 */

const pool = require('../config/db');

/**
 * Execute a function within a database transaction
 * @param {Function} callback - Async function that receives a database client
 * @returns {Promise} The result of the callback function
 * @throws {Error} If any operation fails, the transaction is rolled back and error is thrown
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Execute multiple queries in a transaction
 * @param {Array<{query: string, values: Array}>} queries - Array of query objects
 * @returns {Promise<Array>} Array of query results
 */
const executeTransaction = async (queries) => {
  return withTransaction(async (client) => {
    const results = [];
    for (const { query, values } of queries) {
      const result = await client.query(query, values || []);
      results.push(result);
    }
    return results;
  });
};

module.exports = {
  withTransaction,
  executeTransaction,
};

