import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: 10,
  timezone: 'Z' // guarda en UTC
});

// prueba rápida opcional:
// const [rows] = await pool.query('SELECT 1 AS ok'); console.log(rows);
