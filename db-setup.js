import pg from 'pg';

// Map Azure PostgreSQL environment variables to standard ones if needed
if (process.env.AZURE_POSTGRESQL_HOST && !process.env.PGHOST) {
  process.env.PGHOST = process.env.AZURE_POSTGRESQL_HOST;
  process.env.PGUSER = process.env.AZURE_POSTGRESQL_USER;
  process.env.PGPASSWORD = process.env.AZURE_POSTGRESQL_PASSWORD;
  process.env.PGDATABASE = process.env.AZURE_POSTGRESQL_DATABASE;
  process.env.PGPORT = process.env.AZURE_POSTGRESQL_PORT;
  process.env.PGSSLMODE = process.env.AZURE_POSTGRESQL_SSL ? 'require' : 'prefer';
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.AZURE_POSTGRESQL_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function setup() {
  try {
    console.log('Setting up database tables...');
    
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created or verified');
    
    // Create categories table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) CHECK (type IN ('income', 'expense')),
        icon TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Categories table created or verified');
    
    // Create transactions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(50) CHECK (type IN ('income', 'expense')),
        date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        category_id INTEGER REFERENCES categories(id),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Transactions table created or verified');
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    pool.end();
  }
}

setup();
