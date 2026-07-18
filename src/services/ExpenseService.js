import DatabaseHelper from '../database/DatabaseHelper';

class ExpenseService {
  /**
   * Fetch all expenses
   * @returns {Promise<any[]>}
   */
  static async getAllExpenses() {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query('SELECT * FROM Expenses ORDER BY date DESC, id DESC;');
  }

  /**
   * Add an expense and update the DailySummary table
   * @param {object} expense
   * @returns {Promise<number>} Inserted expense ID
   */
  static async addExpense(expense) {
    const dbHelper = await DatabaseHelper.getInstance();
    let lastInsertRowId = null;

    await dbHelper.transaction(async () => {
      const result = await dbHelper.execute(
        'INSERT INTO Expenses (category, amount, description, date) VALUES (?, ?, ?, ?);',
        [
          expense.category,
          expense.amount,
          expense.description || '',
          expense.date || new Date().toISOString().split('T')[0]
        ]
      );
      lastInsertRowId = result.lastInsertRowId;

      // Upsert DailySummary total_expense
      const targetDate = expense.date || new Date().toISOString().split('T')[0];
      await dbHelper.execute(
        `INSERT INTO DailySummary (date, total_income, total_expense)
         VALUES (?, 0, ?)
         ON CONFLICT(date) DO UPDATE SET total_expense = total_expense + excluded.total_expense;`,
        [targetDate, expense.amount]
      );
    });

    return lastInsertRowId;
  }

  /**
   * Delete an expense and update the corresponding DailySummary
   * @param {number} id
   */
  static async deleteExpense(id) {
    const dbHelper = await DatabaseHelper.getInstance();

    await dbHelper.transaction(async () => {
      const expense = await dbHelper.queryFirst('SELECT * FROM Expenses WHERE id = ?;', [id]);
      if (!expense) return;

      await dbHelper.execute('DELETE FROM Expenses WHERE id = ?;', [id]);

      // Deduct from DailySummary
      await dbHelper.execute(
        `UPDATE DailySummary 
         SET total_expense = MAX(0, total_expense - ?) 
         WHERE date = ?;`,
        [expense.amount, expense.date]
      );
    });
  }
}

export default ExpenseService;
