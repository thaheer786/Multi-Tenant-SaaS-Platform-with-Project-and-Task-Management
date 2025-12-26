#!/usr/bin/env node

/**
 * Seed Data Runner
 * Loads seed data into the database
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function runSeeds() {
  const client = await pool.connect();
  
  try {
    console.log('Loading seed data...');
    
    const seedPath = path.join(__dirname, 'seed_data.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✓ Seed data loaded successfully');
  } catch (error) {
    console.error('✗ Seed loading failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };
