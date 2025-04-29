const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// MySQL Connection Config
const mysqlConfig = {
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'your_mysql_db'
};

// PostgreSQL Connection Config
const pgConfig = {
  host: 'localhost',
  user: 'your_pg_user',
  password: 'your_pg_password',
  database: 'your_pg_db',
  port: 5432,
};

// Function to handle safe timestamps
function safeDate(val) {
  if (!val || val === '0000-00-00 00:00:00' || isNaN(new Date(val).getTime())) {
    return new Date().toISOString(); // ISO format
  }
  return new Date(val).toISOString();
}

// Function to convert 'Y'/'N' to boolean
function toBool(val) {
  if (val === 'Y') return true;
  if (val === 'N') return false;
  return val; // otherwise keep original
}

// MAIN Migration Function
(async () => {
  const mysqlConn = await mysql.createConnection(mysqlConfig);
  const pgClient = new Client(pgConfig);
  await pgClient.connect();

  const tableName = 'branch'; // <--- Set your table name here
  const pgTableName = 'sb.branch'; // <--- Set your PG table name here

  try {
    // Fetch all data from MySQL table
    const [rows] = await mysqlConn.execute(`SELECT * FROM ${tableName}`);

    if (rows.length === 0) {
      console.log(`No data found in MySQL table '${tableName}'`);
      return;
    }

    // Dynamically get columns
    const mysqlColumns = Object.keys(rows[0]);

    for (const row of rows) {
      const row_id = uuidv4();

      // Dynamic values preparation
      const pgColumns = ['row_id', ...mysqlColumns.map(col => col.toLowerCase())]; // Optional: change case if needed
      const placeholders = pgColumns.map((_, idx) => `$${idx + 1}`);
      const values = [
        row_id,
        ...mysqlColumns.map(col => {
          if (col.toLowerCase().includes('date') || col.toLowerCase().includes('timestamp')) {
            return safeDate(row[col]);
          }
          if (typeof row[col] === 'string' && (row[col] === 'Y' || row[col] === 'N')) {
            return toBool(row[col]);
          }
          return row[col];
        })
      ];

      const insertQuery = `
        INSERT INTO ${pgTableName} (${pgColumns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (row_id) DO NOTHING
      `;

      await pgClient.query(insertQuery, values);

      console.log(`Inserted row ID: ${row_id}`);
    }

    console.log(`Data migration for table '${tableName}' completed successfully!`);
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await mysqlConn.end();
    await pgClient.end();
  }
})();
