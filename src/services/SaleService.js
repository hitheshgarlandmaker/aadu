import DatabaseHelper from '../database/DatabaseHelper';

class SaleService {
  /**
   * Fetch all sales with Customer details
   * @returns {Promise<any[]>}
   */
  static async getAllSales() {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query(`
      SELECT Sales.*, Customers.name as customer_name, Customers.phone as customer_phone
      FROM Sales
      LEFT JOIN Customers ON Sales.customer_id = Customers.id
      ORDER BY sale_date DESC, Sales.id DESC;
    `);
  }

  /**
   * Record a sale: updates Sales, updates Goats status to 'sold', and updates DailySummary income
   * @param {object} sale
   * @returns {Promise<number>} Inserted sale ID
   */
  static async addSale(sale) {
    const dbHelper = await DatabaseHelper.getInstance();
    let lastInsertRowId = null;
    const goatIdsList = sale.goat_ids_list || [];
    const goatIdsJson = JSON.stringify(goatIdsList);
    const saleDate = sale.sale_date || new Date().toISOString().split('T')[0];

    await dbHelper.transaction(async () => {
      // 1. Insert the Sale
      const result = await dbHelper.execute(
        'INSERT INTO Sales (customer_id, goat_ids_list, total_amount, paid_status, sale_date, notes) VALUES (?, ?, ?, ?, ?, ?);',
        [
          sale.customer_id,
          goatIdsJson,
          sale.total_amount,
          sale.paid_status || 'pending',
          saleDate,
          sale.notes || ''
        ]
      );
      lastInsertRowId = result.lastInsertRowId;

      // 2. Update the Goats status to 'sold'
      if (goatIdsList.length > 0) {
        const placeholders = goatIdsList.map(() => '?').join(',');
        await dbHelper.execute(
          `UPDATE Goats SET status = 'sold' WHERE id IN (${placeholders});`,
          goatIdsList
        );
      }

      // 3. Upsert DailySummary total_income
      await dbHelper.execute(
        `INSERT INTO DailySummary (date, total_income, total_expense)
         VALUES (?, ?, 0)
         ON CONFLICT(date) DO UPDATE SET total_income = total_income + excluded.total_income;`,
        [saleDate, sale.total_amount]
      );
    });

    return lastInsertRowId;
  }

  /**
   * Delete a sale: deletes the Sale record, reverts Goats to 'available', and deducts from DailySummary income
   * @param {number} id
   */
  static async deleteSale(id) {
    const dbHelper = await DatabaseHelper.getInstance();

    await dbHelper.transaction(async () => {
      const sale = await dbHelper.queryFirst('SELECT * FROM Sales WHERE id = ?;', [id]);
      if (!sale) return;

      const goatIdsList = JSON.parse(sale.goat_ids_list || '[]');

      // 1. Delete Sale Record
      await dbHelper.execute('DELETE FROM Sales WHERE id = ?;', [id]);

      // 2. Revert Goat status to 'available' (if they are currently 'sold')
      if (goatIdsList.length > 0) {
        const placeholders = goatIdsList.map(() => '?').join(',');
        await dbHelper.execute(
          `UPDATE Goats SET status = 'available' WHERE id IN (${placeholders}) AND status = 'sold';`,
          goatIdsList
        );
      }

      // 3. Deduct from DailySummary
      await dbHelper.execute(
        `UPDATE DailySummary 
         SET total_income = MAX(0, total_income - ?) 
         WHERE date = ?;`,
        [sale.total_amount, sale.sale_date]
      );
    });
  }
}

export default SaleService;
