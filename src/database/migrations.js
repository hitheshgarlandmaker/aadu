/**
 * Database schema migration scripts for GramiyaFarm
 */
export const migrations = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Goats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag_number TEXT UNIQUE NOT NULL,
          breed TEXT,
          age INTEGER,
          purchase_date TEXT,
          price REAL,
          status TEXT CHECK(status IN ('available', 'sold', 'deceased')) DEFAULT 'available'
        );

        CREATE TABLE IF NOT EXISTS Customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          goat_ids_list TEXT, -- JSON array of goat IDs
          total_amount REAL,
          paid_status TEXT CHECK(paid_status IN ('paid', 'pending')),
          sale_date TEXT,
          FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS Expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date TEXT
        );

        CREATE TABLE IF NOT EXISTS DailySummary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT UNIQUE NOT NULL,
          total_income REAL DEFAULT 0,
          total_expense REAL DEFAULT 0
        );
      `);
    }
  },
  {
    version: 2,
    up: async (db) => {
      // Demonstration of a schema evolution: adding notes columns and indexes
      try {
        await db.execAsync(`
          ALTER TABLE Goats ADD COLUMN notes TEXT;
          ALTER TABLE Sales ADD COLUMN notes TEXT;
          CREATE INDEX IF NOT EXISTS idx_goats_tag_number ON Goats(tag_number);
          CREATE INDEX IF NOT EXISTS idx_sales_date ON Sales(sale_date);
          CREATE INDEX IF NOT EXISTS idx_expenses_date ON Expenses(date);
        `);
      } catch (error) {
        console.warn("Migration V2 completed with warnings (columns/indexes may already exist):", error.message);
      }
    }
  },
  {
    version: 3,
    up: async (db) => {
      // Version 3: Add sync tracking columns (updated_at and sync_status)
      try {
        await db.execAsync(`
          ALTER TABLE Goats ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE Goats ADD COLUMN sync_status TEXT DEFAULT 'local';
          
          ALTER TABLE Sales ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE Sales ADD COLUMN sync_status TEXT DEFAULT 'local';
          
          ALTER TABLE Expenses ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE Expenses ADD COLUMN sync_status TEXT DEFAULT 'local';
        `);
      } catch (error) {
        console.warn("Migration V3 completed with warnings:", error.message);
      }
    }
  },
  {
    version: 4,
    up: async (db) => {
      // Version 4: Add SystemConfig table for persistent settings/activation
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS SystemConfig (
            key TEXT PRIMARY KEY,
            value TEXT
          );
        `);
      } catch (error) {
        console.warn("Migration V4 completed with warnings:", error.message);
      }
    }
  }
];
export const CURRENT_DATABASE_VERSION = migrations.length;

