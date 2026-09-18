import "dotenv/config";
import app from "./app";
import pool from "./config/database";

const PORT = process.env.PORT || 5000;

pool.query("SELECT NOW()")
  .then((result) => {
    console.log("PostgreSQL connected:", result.rows[0]);
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed:", error);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});