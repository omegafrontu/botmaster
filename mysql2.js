import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.HOST,
  port: Number(process.env.MYPORT), // ← Ensure it's a number
  database: process.env.DB,
  user: process.env.USER,
  password: process.env.PASS,
  connectionLimit: 50,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;

// mysql2.js
// import mysql from "mysql2/promise"; // ← Use promise version!
// import dotenv from "dotenv";
// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.HOST,
//   port: Number(process.env.MYPORT), // ← Ensure it's a number
//   database: process.env.DB,
//   user: process.env.USER,
//   password: process.env.PASS,
//   connectionLimit: 50,
//   waitForConnections: true,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0,
// });

// // Optional: Test connection on startup
// pool
//   .getConnection()
//   .then((conn) => {
//     console.log("MySQL Connected Successfully!");
//     conn.release();
//   })
//   .catch((err) => {
//     console.error("MySQL Connection Failed:", err.message);
//     process.exit(1); // Stop if DB is down
//   });

// export default pool;
