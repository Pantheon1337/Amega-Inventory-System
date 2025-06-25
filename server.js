const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: config.websocket.cors });

app.use(cors(config.cors));
app.use(bodyParser.json());

// --- Вспомогательные функции ---
function readDB() {
  return JSON.parse(fs.readFileSync(config.database.file, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(config.database.file, JSON.stringify(data, null, 2));
}
function emitUpdate(table, action, payload) {
  io.emit('db_update', { table, action, payload });
}

// --- CRUD для всех сущностей ---
const tables = ['devices', 'networkDevices', 'storageItems', 'employees', 'history', 'mfu', 'serverEquipment'];
tables.forEach((table) => {
  // Получить все
  app.get(`/api/${table}`, (req, res) => {
    const db = readDB();
    res.json(db[table] || []);
  });
  // Получить по id
  app.get(`/api/${table}/:id`, (req, res) => {
    const db = readDB();
    const item = (db[table] || []).find((el) => String(el.id) === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  // Добавить
  app.post(`/api/${table}`, (req, res) => {
    const db = readDB();
    const arr = db[table] || [];
    const newItem = { ...req.body, id: Date.now() };
    arr.push(newItem);
    db[table] = arr;
    writeDB(db);
    emitUpdate(table, 'create', newItem);
    res.json(newItem);
});
  // Обновить
  app.put(`/api/${table}/:id`, (req, res) => {
    const db = readDB();
    let arr = db[table] || [];
    const idx = arr.findIndex((el) => String(el.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    arr[idx] = { ...arr[idx], ...req.body };
    db[table] = arr;
    writeDB(db);
    emitUpdate(table, 'update', arr[idx]);
    res.json(arr[idx]);
  });
  // Удалить
  app.delete(`/api/${table}/:id`, (req, res) => {
    const db = readDB();
    let arr = db[table] || [];
    const idx = arr.findIndex((el) => String(el.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const deleted = arr.splice(idx, 1)[0];
    db[table] = arr;
    writeDB(db);
    emitUpdate(table, 'delete', deleted);
    res.json({ status: 'ok' });
  });
});

// Получить всю базу (для бэкапа)
app.get('/api/db.json', (req, res) => {
  res.json(readDB());
});

// Перезаписать всю базу (для восстановления)
app.post('/api/db.json', (req, res) => {
  try {
    // Проверяем структуру данных
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Проверяем наличие основных таблиц
    const requiredTables = ['devices', 'networkDevices', 'storageItems', 'employees', 'history', 'mfu', 'serverEquipment'];
    const missingTables = requiredTables.filter(table => !req.body[table]);
    
    if (missingTables.length > 0) {
      console.warn('Missing tables in import:', missingTables);
    }

    // Создаем резервную копию перед импортом
    const currentDB = readDB();
    const backupName = `pre-import-backup-${Date.now()}`;
    const backupData = {
      name: backupName,
      timestamp: new Date().toISOString(),
      data: currentDB
    };
    
    if (!fs.existsSync(config.database.backupDir)) {
      fs.mkdirSync(config.database.backupDir);
    }
    
    const backupFile = `${config.database.backupDir}/${backupName}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log('Pre-import backup created:', backupFile);

    // Записываем новые данные
    writeDB(req.body);
    emitUpdate('all', 'replace', req.body);
    
    res.json({ 
      status: 'ok',
      message: 'Database imported successfully',
      backupCreated: backupFile,
      tablesImported: Object.keys(req.body).length
    });
  } catch (error) {
    console.error('Error importing database:', error);
    res.status(500).json({ error: 'Failed to import database' });
  }
});

// API для создания бэкапа
app.post('/api/backup', (req, res) => {
  try {
    const db = readDB();
    const backupName = req.body.name || `backup-${Date.now()}`;
    const backupData = {
      name: backupName,
      timestamp: new Date().toISOString(),
      data: db
    };
    
    // Создаем папку backups если её нет
    if (!fs.existsSync(config.database.backupDir)) {
      fs.mkdirSync(config.database.backupDir);
    }
    
    const backupFile = `${config.database.backupDir}/${backupName}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    res.json({ 
      status: 'success', 
      message: 'Backup created successfully',
      filename: backupFile,
      timestamp: backupData.timestamp
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// API для получения списка бэкапов
app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(config.database.backupDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(config.database.backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = `${config.database.backupDir}/${file}`;
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          name: content.name,
          timestamp: content.timestamp,
          size: stats.size,
          filename: file
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(files);
  } catch (error) {
    console.error('Error getting backups:', error);
    res.status(500).json({ error: 'Failed to get backups' });
  }
});

// API для восстановления из бэкапа
app.post('/api/restore/:filename', (req, res) => {
  try {
    const backupFile = `${config.database.backupDir}/${req.params.filename}`;
    
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    writeDB(backupData.data);
    emitUpdate('all', 'restore', backupData.data);
    
    res.json({ 
      status: 'success', 
      message: 'Database restored successfully',
      timestamp: backupData.timestamp
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// API для удаления бэкапа
app.delete('/api/backup/:filename', (req, res) => {
  try {
    const backupFile = `${config.database.backupDir}/${req.params.filename}`;
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    fs.unlinkSync(backupFile);
    res.json({ status: 'success', message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// --- WebSocket ---
io.on('connection', (socket) => {
  if (config.logging.enabled) {
    console.log('Client connected:', socket.id);
  }
  socket.on('disconnect', () => {
    if (config.logging.enabled) {
      console.log('Client disconnected:', socket.id);
    }
  });
});

// Раздача статики для бэкапов
app.use(config.static.backupsPath, express.static(path.join(__dirname, config.database.backupDir)));

// Раздача статики React (должно быть ПОСЛЕ всех API маршрутов)
app.use(express.static(path.join(__dirname, config.static.buildDir)));

// Обработка всех остальных запросов (должно быть ПОСЛЕ всех API маршрутов)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, config.static.buildDir, 'index.html'));
});

server.listen(config.server.port, config.server.host, () => {
  console.log(`Server running at ${config.server.url}/`);
});