import DatabaseHelper from '../database/DatabaseHelper';

class GoatService {
  /**
   * Fetch all goats
   * @returns {Promise<any[]>}
   */
  static async getAllGoats() {
    const dbHelper = await DatabaseHelper.getInstance();
    return await dbHelper.query('SELECT * FROM Goats ORDER BY id DESC;');
  }

  /**
   * Find a goat by its tag number or ID
   * @param {number|string} identifier
   * @returns {Promise<any>}
   */
  static async getGoat(identifier) {
    const dbHelper = await DatabaseHelper.getInstance();
    if (typeof identifier === 'number') {
      return await dbHelper.queryFirst('SELECT * FROM Goats WHERE id = ?;', [identifier]);
    }
    return await dbHelper.queryFirst('SELECT * FROM Goats WHERE tag_number = ?;', [identifier]);
  }

  /**
   * Fetch multiple goats by their IDs
   * @param {number[]} ids
   * @returns {Promise<any[]>}
   */
  static async getGoatsByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const dbHelper = await DatabaseHelper.getInstance();
    const placeholders = ids.map(() => '?').join(',');
    return await dbHelper.query(`SELECT * FROM Goats WHERE id IN (${placeholders});`, ids);
  }

  /**
   * Add a new goat
   * @param {object} goat
   * @returns {Promise<number>} Inserted row ID
   */
  static async addGoat(goat) {
    const dbHelper = await DatabaseHelper.getInstance();
    const result = await dbHelper.execute(
      'INSERT INTO Goats (tag_number, breed, age, purchase_date, price, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        goat.tag_number,
        goat.breed || '',
        goat.age || 0,
        goat.purchase_date || new Date().toISOString().split('T')[0],
        goat.price || 0,
        goat.status || 'available',
        goat.notes || ''
      ]
    );
    return result.lastInsertRowId;
  }

  /**
   * Update details of an existing goat
   * @param {number} id
   * @param {object} goat
   */
  static async updateGoat(id, goat) {
    const dbHelper = await DatabaseHelper.getInstance();
    await dbHelper.execute(
      'UPDATE Goats SET tag_number = ?, breed = ?, age = ?, purchase_date = ?, price = ?, status = ?, notes = ? WHERE id = ?;',
      [
        goat.tag_number,
        goat.breed || '',
        goat.age || 0,
        goat.purchase_date || new Date().toISOString().split('T')[0],
        goat.price || 0,
        goat.status || 'available',
        goat.notes || '',
        id
      ]
    );
  }

  /**
   * Delete a goat record
   * @param {number} id
   */
  static async deleteGoat(id) {
    const dbHelper = await DatabaseHelper.getInstance();
    await dbHelper.execute('DELETE FROM Goats WHERE id = ?;', [id]);
  }
}

export default GoatService;
