import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'database.json');

// Initial in-memory cache
let db = {
  users: [],
  student_profiles: [],
  faculty_profiles: [],
  company_profiles: [],
  tnp_profiles: [],
  placement_drives: [],
  applications: [],
  internships: [],
  attendance_records: [],
  weekly_reports: [],
  offer_letters: [],
  certificates: [],
  notifications: [],
  support_tickets: []
};

export const loadDB = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(raw);
    } else {
      saveDB();
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
  return db;
};

export const saveDB = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
};

export const getDB = () => db;

export const setDB = (newDB) => {
  db = newDB;
  saveDB();
};

// Generic Collection Helpers
export const find = (table, query = {}) => {
  const list = db[table] || [];
  return list.filter(item => {
    for (const key in query) {
      if (item[key] !== query[key]) return false;
    }
    return true;
  });
};

export const findOne = (table, query = {}) => {
  const list = db[table] || [];
  return list.find(item => {
    for (const key in query) {
      if (item[key] !== query[key]) return false;
    }
    return true;
  }) || null;
};

export const findById = (table, id) => {
  const list = db[table] || [];
  return list.find(item => item.id === id) || null;
};

export const insert = (table, record) => {
  if (!db[table]) db[table] = [];
  const newRecord = {
    id: record.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...record,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db[table].push(newRecord);
  saveDB();
  return newRecord;
};

export const update = (table, id, updates) => {
  if (!db[table]) return null;
  const index = db[table].findIndex(item => item.id === id);
  if (index === -1) return null;
  db[table][index] = {
    ...db[table][index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  saveDB();
  return db[table][index];
};

export const remove = (table, id) => {
  if (!db[table]) return false;
  const initLength = db[table].length;
  db[table] = db[table].filter(item => item.id !== id);
  const changed = db[table].length !== initLength;
  if (changed) saveDB();
  return changed;
};

// Haversine Distance Calculator (meters)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // in meters
};
