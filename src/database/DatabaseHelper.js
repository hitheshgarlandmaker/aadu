import * as SQLite from 'expo-sqlite';
import { migrations, CURRENT_DATABASE_VERSION } from './migrations';

class DatabaseHelper {
  /**
   * @type {DatabaseHelper|null}
   */
  static instance = null;

  constructor() {
    /**
     * @type {SQLite.SQLiteDatabase|null}
     */
    this.db = null;
    this.initialized = false;
  }

  /**
   * Get the singleton instance of DatabaseHelper
   * @returns {Promise<DatabaseHelper>}
   */
  static async getInstance() {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
      await DatabaseHelper.instance.init();
    }
    return DatabaseHelper.instance;
  }

  /**
   * Initialize the SQLite database and run migration scripts
   */
  async init() {
    if (this.initialized) return;
    try {
      this.db = await SQLite.openDatabaseAsync('gramiya_farm.db');
      await this.runMigrations();
      this.initialized = true;
      console.log('GramiyaFarm SQLite Database initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  /**
   * Retrieve the current schema version and run outstanding migration scripts
   */
  async runMigrations() {
    if (!this.db) return;

    // Get current user version pragma
    const result = await this.db.getFirstAsync('PRAGMA user_version;');
    // In some systems it returns user_version, in some it's the first key
    let currentVersion = 0;
    if (result) {
      currentVersion = result.user_version !== undefined ? result.user_version : Object.values(result)[0] || 0;
    }

    console.log(`Current SQLite Schema Version: ${currentVersion}, Target Version: ${CURRENT_DATABASE_VERSION}`);

    if (currentVersion < CURRENT_DATABASE_VERSION) {
      for (let i = currentVersion; i < CURRENT_DATABASE_VERSION; i++) {
        const migration = migrations[i];
        console.log(`Applying migration to database version ${migration.version}...`);
        await migration.up(this.db);
        currentVersion = migration.version;
        // Update SQLite internal version pragma
        await this.db.execAsync(`PRAGMA user_version = ${currentVersion};`);
      }
      console.log(`SQLite Database schema successfully migrated to version ${currentVersion}`);
    } else {
      console.log('SQLite Database schema is up to date.');
    }
  }

  // --- Core CRUD Wrappers ---

  /**
   * Execute write queries (INSERT, UPDATE, DELETE)
   * @param {string} sql
   * @param {any[]} [params]
   * @returns {Promise<SQLite.SQLiteRunResult>}
   */
  async execute(sql, params = []) {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.runAsync(sql, params);
  }

  /**
   * Execute read queries returning all rows
   * @param {string} sql
   * @param {any[]} [params]
   * @returns {Promise<any[]>}
   */
  async query(sql, params = []) {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync(sql, params);
  }

  /**
   * Execute read queries returning the first matched row
   * @param {string} sql
   * @param {any[]} [params]
   * @returns {Promise<any>}
   */
  async queryFirst(sql, params = []) {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync(sql, params);
  }

  /**
   * Run operations inside a database transaction block
   * @param {() => Promise<void>} txFunc
   */
  async transaction(txFunc) {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.withTransactionAsync(txFunc);
  }
}

export default DatabaseHelper;
