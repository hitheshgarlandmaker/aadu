import DatabaseHelper from '../database/DatabaseHelper';

class CustomerService {
  /**
   * Fetch all customers
   * @returns {Promise<any[]>}
   */
  static async getAllCustomers() {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query('SELECT * FROM Customers ORDER BY name ASC;');
  }

  /**
   * Fetch a single customer by ID
   * @param {number} id
   * @returns {Promise<any>}
   */
  static async getCustomerById(id) {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.queryFirst('SELECT * FROM Customers WHERE id = ?;', [id]);
  }

  /**
   * Add a new customer
   * @param {object} customer
   * @returns {Promise<number>} Inserted row ID
   */
  static async addCustomer(customer) {
    const dbHelper = await DatabaseHelper.getInstance();
    const result = await dbHelper.execute(
      'INSERT INTO Customers (name, phone, address, created_at) VALUES (?, ?, ?, ?);',
      [
        customer.name,
        customer.phone || '',
        customer.address || '',
        customer.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  }

  /**
   * Update an existing customer details
   * @param {number} id
   * @param {object} customer
   */
  static async updateCustomer(id, customer) {
    const dbHelper = await DatabaseHelper.getInstance();
    await dbHelper.execute(
      'UPDATE Customers SET name = ?, phone = ?, address = ? WHERE id = ?;',
      [customer.name, customer.phone || '', customer.address || '', id]
    );
  }

  /**
   * Delete a customer record
   * @param {number} id
   */
  static async deleteCustomer(id) {
    const dbHelper = await DatabaseHelper.getInstance();
    await dbHelper.execute('DELETE FROM Customers WHERE id = ?;', [id]);
  }
}

export default CustomerService;
