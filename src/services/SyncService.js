import DatabaseHelper from '../database/DatabaseHelper';

const BACKEND_URL = 'http://localhost:3000';

class SyncService {
  /**
   * Sync local data with Express Server
   * Performs 2-way merge, saves back to client and updates summaries.
   */
  static async syncData() {
    const dbHelper = await DatabaseHelper.getInstance();

    // 1. Fetch current local tables state
    const localGoats = await dbHelper.query('SELECT * FROM Goats;');
    const localSales = await dbHelper.query('SELECT * FROM Sales;');
    const localExpenses = await dbHelper.query('SELECT * FROM Expenses;');

    // 2. Perform HTTP Sync Request
    const response = await fetch(`${BACKEND_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goats: localGoats,
        sales: localSales,
        expenses: localExpenses,
      }),
    });

    if (!response.ok) {
      throw new Error('ஒத்திசைவு சேவையகம் பிழையை ஏற்படுத்தியது (Sync server error)');
    }

    const master = await response.json();

    // 3. Atomically overwrite local tables inside a transaction
    await dbHelper.transaction(async () => {
      // Clear current lists
      await dbHelper.execute('DELETE FROM Goats;');
      await dbHelper.execute('DELETE FROM Sales;');
      await dbHelper.execute('DELETE FROM Expenses;');
      await dbHelper.execute('DELETE FROM DailySummary;');

      // Re-populate Goats
      for (const g of master.goats) {
        await dbHelper.execute(
          `INSERT INTO Goats (id, tag_number, breed, age, purchase_date, price, status, notes, updated_at, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            g.id,
            g.tag_number,
            g.breed || '',
            g.age || 0,
            g.purchase_date,
            g.price || 0,
            g.status || 'available',
            g.notes || '',
            g.updated_at || new Date().toISOString(),
            'synced',
          ]
        );
      }

      // Re-populate Expenses & build DailySummary
      for (const e of master.expenses) {
        await dbHelper.execute(
          `INSERT INTO Expenses (id, category, amount, description, date, updated_at, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            e.id,
            e.category,
            e.amount,
            e.description || '',
            e.date,
            e.updated_at || new Date().toISOString(),
            'synced',
          ]
        );

        await dbHelper.execute(
          `INSERT INTO DailySummary (date, total_income, total_expense) 
           VALUES (?, 0, ?) 
           ON CONFLICT(date) DO UPDATE SET total_expense = total_expense + excluded.total_expense;`,
          [e.date, e.amount]
        );
      }

      // Re-populate Sales & build DailySummary
      for (const s of master.sales) {
        await dbHelper.execute(
          `INSERT INTO Sales (id, customer_id, goat_ids_list, total_amount, paid_status, sale_date, notes, updated_at, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            s.id,
            s.customer_id,
            s.goat_ids_list,
            s.total_amount,
            s.paid_status || 'pending',
            s.sale_date,
            s.notes || '',
            s.updated_at || new Date().toISOString(),
            'synced',
          ]
        );

        await dbHelper.execute(
          `INSERT INTO DailySummary (date, total_income, total_expense) 
           VALUES (?, ?, 0) 
           ON CONFLICT(date) DO UPDATE SET total_income = total_income + excluded.total_income;`,
          [s.sale_date, s.total_amount]
        );
      }
    });

    console.log('Local client DB synchronized with master server.');
  }

  /**
   * Performs license check against Express backend
   * @param {string} deviceId 
   * @returns {Promise<object>} Status { valid: boolean, expiresAt: string, message: string }
   */
  static async validateLicense(deviceId) {
    try {
      const response = await fetch(`${BACKEND_URL}/validate-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        return { valid: true, expiresAt: '', error: true }; // Permissive bypass on server errors
      }

      return await response.json();
    } catch (e) {
      console.warn('License check server unreachable, defaulting to cached offline access:', e);
      return { valid: true, expiresAt: '', offline: true }; // Fail-open offline support
    }
  }
}

export default SyncService;
