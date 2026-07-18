/**
 * @typedef {Object} Goat
 * @property {number} [id] - Auto-incremented primary key
 * @property {string} tag_number - Unique identification tag number for the goat
 * @property {string} breed - Breed of the goat
 * @property {number} age - Age of the goat in months/years
 * @property {string} purchase_date - ISO date string (YYYY-MM-DD)
 * @property {number} price - Purchase price
 * @property {('available'|'sold'|'deceased')} status - Status of the goat
 */

/**
 * @typedef {Object} Customer
 * @property {number} [id] - Auto-incremented primary key
 * @property {string} name - Name of the customer
 * @property {string} phone - Contact phone number
 * @property {string} address - Billing/shipping address
 * @property {string} created_at - ISO date string of creation
 */

/**
 * @typedef {Object} Sale
 * @property {number} [id] - Auto-incremented primary key
 * @property {number} customer_id - Foreign key referencing Customers.id
 * @property {number[]} goat_ids_list - Array of Goat IDs associated with this sale
 * @property {number} total_amount - Total sale amount
 * @property {('paid'|'pending')} paid_status - Payment status
 * @property {string} sale_date - ISO date string of the sale
 */

/**
 * @typedef {Object} Expense
 * @property {number} [id] - Auto-incremented primary key
 * @property {string} category - Expense category (e.g., Feed, Medicine, Maintenance)
 * @property {number} amount - Expense amount
 * @property {string} description - Detailed description
 * @property {string} date - ISO date string of the expense
 */

/**
 * @typedef {Object} DailySummary
 * @property {number} [id] - Auto-incremented primary key
 * @property {string} date - Unique ISO date string (YYYY-MM-DD)
 * @property {number} total_income - Sum of sales income on this date
 * @property {number} total_expense - Sum of expenses on this date
 */
