import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  },
  jwtSecret: process.env.JWT_SECRET || 'dev'
};
