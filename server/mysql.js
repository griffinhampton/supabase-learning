/* eslint-env node */
import mysql from "mysql";

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "cse335.courses.cse.louisville.edu",
  user: process.env.DB_USER || "student_gmhamp01",
  password: process.env.DB_PASSWORD || "Spring26",
  database: process.env.DB_NAME || "JSONify",
});

connection.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    process.exitCode = 1;
    return;
  }

  console.log("connected!");
  connection.end();
});
