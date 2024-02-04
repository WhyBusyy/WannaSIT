import "dotenv/config";
import mysql from "mysql2/promise";

async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
}

async function executeQuery(connection, query, params) {
  return await connection.execute(query, params);
}

async function endConnection(connection) {
  return await connection.end();
}

export { getConnection, executeQuery, endConnection };
