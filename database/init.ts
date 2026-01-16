/**
 * Database Initialization Module
 * Initializes SQLite database for app-sisreurb PWA
 * Handles schema creation and database setup
 */

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

export class DatabaseService {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string = './sisreurb.db') {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and create schema
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        try {
          // Enable foreign keys
          await this.run('PRAGMA foreign_keys = ON');
          
          // Create schema
          await this.createSchema();
          
          console.log(`✓ Database initialized at: ${this.dbPath}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Execute SQL file to create schema
   */
  private async createSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      await this.run(statement);
    }

    console.log('✓ Schema created successfully');
  }

  /**
   * Execute a single SQL statement
   */
  private run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(new Error(`SQL Error: ${err.message}\n${sql}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Execute a query and get all results
   */
  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new Error(`SQL Error: ${err.message}`));
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Execute a query and get a single result
   */
  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(new Error(`SQL Error: ${err.message}`));
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Insert a record
   */
  async insert(table: string, data: Record<string, any>): Promise<string> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(new Error(`Insert Error: ${err.message}`));
        } else {
          resolve(this.lastID.toString());
        }
      });
    });
  }

  /**
   * Update a record
   */
  async update(table: string, data: Record<string, any>, whereClause: string, whereParams: any[]): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [...values, ...whereParams], function(err) {
        if (err) {
          reject(new Error(`Update Error: ${err.message}`));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Delete records
   */
  async delete(table: string, whereClause: string, whereParams: any[]): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, whereParams, function(err) {
        if (err) {
          reject(new Error(`Delete Error: ${err.message}`));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(new Error(`Failed to close database: ${err.message}`));
          } else {
            console.log('✓ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    const tables = ['reurb_projects', 'reurb_quadras', 'reurb_properties', 'reurb_surveys'];
    
    for (const table of tables) {
      const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result?.count || 0;
    }
    
    return stats;
  }
}

// Example usage
if (require.main === module) {
  const db = new DatabaseService('./sisreurb.db');
  
  db.init()
    .then(async () => {
      const stats = await db.getStats();
      console.log('Database statistics:', stats);
      await db.close();
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default DatabaseService;
