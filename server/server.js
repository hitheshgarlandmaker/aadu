const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Initialize JSON database if it doesn't exist
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      goats: [],
      sales: [],
      expenses: [],
      licenses: [
        { deviceId: 'EXPIRED_DEVICE', valid: false, expiresAt: '2026-07-01' },
        { deviceId: 'VALID_DEVICE', valid: true, expiresAt: '2027-07-18' }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- REST API Endpoints ---

/**
 * Validate License/Subscription
 * Checks if a device ID has an active subscription.
 * If device ID is brand new, we auto-register a 14-day free trial.
 */
app.post('/validate-license', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    return res.status(400).json({ valid: false, error: 'Device ID is required' });
  }

  const db = readDb();
  let license = db.licenses.find(l => l.deviceId === deviceId);

  // Auto-register new devices with a 14-day free trial
  if (!license) {
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14);
    
    license = {
      deviceId,
      valid: true,
      expiresAt: trialExpiry.toISOString().split('T')[0]
    };
    db.licenses.push(license);
    writeDb(db);
  }

  // Check expiration date
  const today = new Date().toISOString().split('T')[0];
  const isValid = license.valid && license.expiresAt >= today;

  res.json({
    valid: isValid,
    expiresAt: license.expiresAt,
    message: isValid 
      ? 'சந்தா செல்லுபடியாகும் (Active License)' 
      : 'ஆண்டு சந்தா காலம் முடிவடைந்தது. புதுப்பிக்க கட்டணம் ₹3,000.'
  });
});

/**
 * Helper to merge records (Conflict Resolution: Server timestamp wins)
 */
function mergeLists(serverList, clientList) {
  const mergedMap = new Map();
  
  // 1. Add all server items to map
  serverList.forEach(item => {
    mergedMap.set(item.id || item.tag_number, item);
  });

  // 2. Process client items
  clientList.forEach(clientItem => {
    const key = clientItem.id || clientItem.tag_number;
    const serverItem = mergedMap.get(key);

    if (!serverItem) {
      // New client item: upload it
      clientItem.sync_status = 'synced';
      mergedMap.set(key, clientItem);
    } else {
      // Conflict: Compare timestamps
      const serverTime = serverItem.updated_at ? new Date(serverItem.updated_at).getTime() : 0;
      const clientTime = clientItem.updated_at ? new Date(clientItem.updated_at).getTime() : 0;

      if (clientTime > serverTime) {
        // Client record is newer, update server
        clientItem.sync_status = 'synced';
        mergedMap.set(key, clientItem);
      } else {
        // Server record is newer/equal (Server wins)
        serverItem.sync_status = 'synced';
        mergedMap.set(key, serverItem);
      }
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Two-way Synchronization Endpoint
 * Merges client goats, sales, and expenses tables with server tables,
 * and returns the updated master lists.
 */
app.post('/sync', (req, res) => {
  const { goats, sales, expenses } = req.body;
  if (!goats || !sales || !expenses) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }

  const db = readDb();

  // Merge datasets
  db.goats = mergeLists(db.goats, goats);
  db.sales = mergeLists(db.sales, sales);
  db.expenses = mergeLists(db.expenses, expenses);

  // Persist master state
  writeDb(db);

  // Return merged master state
  res.json({
    goats: db.goats,
    sales: db.sales,
    expenses: db.expenses
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`GramiyaFarm Backend Server running on http://localhost:${PORT}`);
  initDb();
});
