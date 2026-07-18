import DatabaseHelper from '../database/DatabaseHelper';

class SummaryService {
  /**
   * Fetch aggregated metrics for the dashboard (Goat counts and financial totals)
   * @returns {Promise<object>} Dashboard metrics object
   */
  static async getDashboardMetrics() {
    const dbHelper = await DatabaseHelper.getInstance();

    // 1. Goat status counts
    const goatCounts = await dbHelper.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
        SUM(CASE WHEN status = 'deceased' THEN 1 ELSE 0 END) as deceased
      FROM Goats;
    `);

    // 2. Financial totals
    const financialTotals = await dbHelper.queryFirst(`
      SELECT 
        SUM(total_income) as total_income,
        SUM(total_expense) as total_expense
      FROM DailySummary;
    `);

    return {
      goats: {
        total: goatCounts[0]?.total || 0,
        available: goatCounts[0]?.available || 0,
        sold: goatCounts[0]?.sold || 0,
        deceased: goatCounts[0]?.deceased || 0,
      },
      finance: {
        total_income: financialTotals?.total_income || 0,
        total_expense: financialTotals?.total_expense || 0,
        net_profit: (financialTotals?.total_income || 0) - (financialTotals?.total_expense || 0),
      }
    };
  }

  /**
   * Fetch today-specific metrics (Available Goats count, Today's Income, Today's Expense, Net profit)
   * @returns {Promise<object>} Today's P&L and available inventory count
   */
  static async getTodayMetrics() {
    const dbHelper = await DatabaseHelper.getInstance();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Count of available goats
    const availableGoats = await dbHelper.queryFirst(
      "SELECT COUNT(*) as count FROM Goats WHERE status = 'available';"
    );

    // 2. Today's income and expense from DailySummary
    const todaySummary = await dbHelper.queryFirst(
      "SELECT total_income, total_expense FROM DailySummary WHERE date = ?;",
      [todayStr]
    );

    const income = todaySummary ? (todaySummary.total_income || 0) : 0;
    const expense = todaySummary ? (todaySummary.total_expense || 0) : 0;

    return {
      availableGoats: availableGoats ? (availableGoats.count || 0) : 0,
      income,
      expense,
      netProfit: income - expense
    };
  }

  /**
   * Fetch aggregate financials for a specific date range
   * @param {string} startDate - ISO date YYYY-MM-DD
   * @param {string} endDate - ISO date YYYY-MM-DD
   * @returns {Promise<object>} Aggregate statistics
   */
  static async getRangeMetrics(startDate, endDate) {
    const dbHelper = await DatabaseHelper.getInstance();
    const result = await dbHelper.queryFirst(`
      SELECT 
        SUM(total_income) as total_sales,
        SUM(total_expense) as total_expenses
      FROM DailySummary
      WHERE date BETWEEN ? AND ?;
    `, [startDate, endDate]);

    const sales = result ? (result.total_sales || 0) : 0;
    const expenses = result ? (result.total_expenses || 0) : 0;

    return {
      sales,
      expenses,
      netProfit: sales - expenses
    };
  }

  /**
   * Fetch individual sales and expenses lists for a specific date range
   * @param {string} startDate - ISO date YYYY-MM-DD
   * @param {string} endDate - ISO date YYYY-MM-DD
   * @returns {Promise<object>} Object containing sales and expenses list
   */
  static async getRangeDetails(startDate, endDate) {
    const dbHelper = await DatabaseHelper.getInstance();

    const sales = await dbHelper.query(`
      SELECT Sales.*, Customers.name as customer_name
      FROM Sales
      LEFT JOIN Customers ON Sales.customer_id = Customers.id
      WHERE sale_date BETWEEN ? AND ?
      ORDER BY sale_date DESC, Sales.id DESC;
    `, [startDate, endDate]);

    const expenses = await dbHelper.query(`
      SELECT * FROM Expenses
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC, id DESC;
    `, [startDate, endDate]);

    return { sales, expenses };
  }

  /**
   * Fetch daily aggregated data for a specific range to use in visual charts
   * @param {string} startDate - ISO date YYYY-MM-DD
   * @param {string} endDate - ISO date YYYY-MM-DD
   * @returns {Promise<any[]>} Daily items list
   */
  static async getDailySummariesForRange(startDate, endDate) {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query(`
      SELECT date, total_income, total_expense 
      FROM DailySummary 
      WHERE date BETWEEN ? AND ? 
      ORDER BY date ASC;
    `, [startDate, endDate]);
  }

  /**
   * Fetch daily summaries for a specific limit of days
   * @param {number} [limit=30]
   * @returns {Promise<any[]>} Daily summaries
   */
  static async getDailySummaries(limit = 30) {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query(
      'SELECT * FROM DailySummary ORDER BY date DESC LIMIT ?;',
      [limit]
    );
  }

  /**
   * Fetch monthly summary reports
   * @returns {Promise<any[]>} Aggregated data group by month (YYYY-MM)
   */
  static async getMonthlySummary() {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(total_income) as monthly_income,
        SUM(total_expense) as monthly_expense,
        SUM(total_income) - SUM(total_expense) as monthly_net
      FROM DailySummary
      GROUP BY month
      ORDER BY month DESC;
    `);
  }
}

export default SummaryService;
