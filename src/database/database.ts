import sqlite3 from 'sqlite3';
import { Device, NetworkDevice, StorageItem, HistoryRecord, Statistics, MFUDevice, ServerDevice } from '../types';

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database('./invent.db', (err) => {
      if (err) {
        console.error('Ошибка подключения к базе данных:', err);
      } else {
        console.log('Подключение к базе данных успешно');
        this.initTables();
      }
    });
  }

  private initTables() {
    // Таблица устройств
    this.db.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT NOT NULL,
        serial_number TEXT UNIQUE NOT NULL,
        user TEXT,
        department TEXT,
        status TEXT CHECK(status IN ('in_use', 'storage', 'broken', 'personal_use', 'repair')) DEFAULT 'storage',
        category TEXT,
        office TEXT,
        location TEXT,
        cpu TEXT,
        ram TEXT,
        drives TEXT,
        gpu TEXT,
        monitor TEXT,
        monitor2 TEXT,
        monitor_price REAL,
        monitor2_price REAL,
        price REAL,
        os TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица сетевых устройств
    this.db.run(`
      CREATE TABLE IF NOT EXISTS network_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT,
        serial_number TEXT,
        ip_address TEXT,
        mac_address TEXT,
        status TEXT CHECK(status IN ('online', 'offline', 'broken', 'personal_use', 'repair')) DEFAULT 'offline',
        location TEXT,
        department TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица МФУ
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mfu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        serial_number TEXT,
        user TEXT,
        department TEXT,
        status TEXT CHECK(status IN ('in_use', 'storage', 'broken', 'personal_use', 'repair')) DEFAULT 'storage',
        category TEXT,
        price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица серверного оборудования
    this.db.run(`
      CREATE TABLE IF NOT EXISTS serverEquipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        serial_number TEXT,
        user TEXT,
        department TEXT,
        status TEXT CHECK(status IN ('in_use', 'storage', 'broken', 'personal_use', 'repair')) DEFAULT 'storage',
        category TEXT,
        price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица складских позиций
    this.db.run(`
      CREATE TABLE IF NOT EXISTS storage_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        price REAL,
        last_check_date DATE,
        responsible_person TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица истории изменений
    this.db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT CHECK(action IN ('create', 'update', 'delete')) NOT NULL,
        field_name TEXT,
        old_value TEXT,
        new_value TEXT,
        user TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица категорий
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);

    // Таблица отделов
    this.db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Вставка начальных данных
    this.insertInitialData();
  }

  private insertInitialData() {
    // Категории
    const categories = [
      { name: 'Компьютеры', icon: 'Monitor', color: '#3B82F6' },
      { name: 'Ноутбуки', icon: 'Laptop', color: '#10B981' },
      { name: 'Мониторы', icon: 'Monitor', color: '#F59E0B' },
      { name: 'Принтеры', icon: 'Printer', color: '#EF4444' },
      { name: 'Сетевое оборудование', icon: 'Wifi', color: '#8B5CF6' },
      { name: 'Кабели', icon: 'Cable', color: '#6B7280' },
      { name: 'Аксессуары', icon: 'Mouse', color: '#EC4899' },
    ];

    categories.forEach(category => {
      this.db.run(
        'INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)',
        [category.name, category.icon, category.color]
      );
    });

    // Отделы
    const departments = [
      { name: 'IT отдел', description: 'Отдел информационных технологий' },
      { name: 'Бухгалтерия', description: 'Бухгалтерский отдел' },
      { name: 'Отдел продаж', description: 'Отдел продаж' },
      { name: 'HR отдел', description: 'Отдел кадров' },
      { name: 'Склад', description: 'Складское помещение' },
    ];

    departments.forEach(dept => {
      this.db.run(
        'INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)',
        [dept.name, dept.description]
      );
    });
  }

  // Методы для работы с устройствами
  async getDevices(): Promise<Device[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM devices ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Device[]);
      });
    });
  }

  async addDevice(device: Omit<Device, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO devices (name, model, serial_number, user, department, status, category, office, location, cpu, ram, drives, gpu, monitor, monitor2, monitor_price, monitor2_price, price, os)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [device.name, device.model, device.serial_number, device.user, device.department, device.status, device.category, device.office, device.location, device.cpu, device.ram, device.drives, device.gpu, device.monitor, device.monitor2, device.monitor_price, device.monitor2_price, device.price, device.os],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateDevice(id: number, device: Partial<Device>): Promise<void> {
    const fields = Object.keys(device).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(field => device[field as keyof Device]);
    values.push(id);

    const query = `UPDATE devices SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async deleteDevice(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM devices WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Методы для работы с сетевыми устройствами
  async getNetworkDevices(): Promise<NetworkDevice[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM network_devices ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as NetworkDevice[]);
      });
    });
  }

  async addNetworkDevice(device: Omit<NetworkDevice, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO network_devices (name, model, serial_number, ip_address, mac_address, status, location, department)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [device.name, device.model, device.serial_number, device.ip_address, device.mac_address, device.status, device.location, device.department],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateNetworkDevice(id: number, device: Partial<NetworkDevice>): Promise<void> {
    const fields = Object.keys(device).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(field => device[field as keyof NetworkDevice]);
    values.push(id);

    const query = `UPDATE network_devices SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Методы для работы со складскими позициями
  async getStorageItems(): Promise<StorageItem[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM storage_items ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as StorageItem[]);
      });
    });
  }

  async addStorageItem(item: Omit<StorageItem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO storage_items (name, category, quantity, price, last_check_date, responsible_person, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.name, item.category, item.quantity, item.price, item.last_check_date, item.responsible_person, item.image_url],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateStorageItem(id: number, item: Partial<StorageItem>): Promise<void> {
    const fields = Object.keys(item).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(field => item[field as keyof StorageItem]);
    values.push(id);

    const query = `UPDATE storage_items SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Методы для получения статистики
  async getStatistics(): Promise<Statistics> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          (SELECT COUNT(*) FROM devices) as total_devices,
          (SELECT COUNT(*) FROM devices WHERE status = 'in_use') as devices_in_use,
          (SELECT COUNT(*) FROM devices WHERE status = 'storage') as devices_in_storage,
          (SELECT COUNT(*) FROM devices WHERE status = 'personal_use') as devices_personal_use,
          (SELECT COUNT(*) FROM devices WHERE status = 'repair') as devices_repair,
          (SELECT COUNT(*) FROM devices WHERE status = 'broken') as devices_broken,
          (SELECT COUNT(*) FROM mfu) as total_mfu,
          (SELECT COUNT(*) FROM mfu WHERE status = 'in_use') as mfu_in_use,
          (SELECT COUNT(*) FROM mfu WHERE status = 'storage') as mfu_in_storage,
          (SELECT COUNT(*) FROM serverEquipment) as total_server,
          (SELECT COUNT(*) FROM serverEquipment WHERE status = 'in_use') as server_in_use,
          (SELECT COUNT(*) FROM serverEquipment WHERE status = 'storage') as server_in_storage,
          (SELECT COUNT(*) FROM network_devices) as total_network_devices,
          (SELECT COUNT(*) FROM network_devices WHERE status = 'online') as network_devices_online,
          (SELECT COUNT(*) FROM storage_items) as total_storage_items,
          (SELECT COUNT(DISTINCT category) FROM storage_items) as storage_categories
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row as Statistics);
      });
    });
  }

  // Методы для работы с историей
  async addHistoryRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO history (table_name, record_id, action, field_name, old_value, new_value, user)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [record.table_name, record.record_id, record.action, record.field_name, record.old_value, record.new_value, record.user],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getHistory(tableName?: string, recordId?: number): Promise<HistoryRecord[]> {
    let query = 'SELECT * FROM history';
    const params: any[] = [];

    if (tableName && recordId) {
      query += ' WHERE table_name = ? AND record_id = ?';
      params.push(tableName, recordId);
    } else if (tableName) {
      query += ' WHERE table_name = ?';
      params.push(tableName);
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as HistoryRecord[]);
      });
    });
  }

  // Методы для работы с категориями
  async getCategories(): Promise<{ id: number; name: string; icon: string; color: string }[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as { id: number; name: string; icon: string; color: string }[]);
      });
    });
  }

  // Методы для работы с отделами
  async getDepartments(): Promise<{ id: number; name: string; description?: string }[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM departments ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as { id: number; name: string; description?: string }[]);
      });
    });
  }

  // Экспорт данных
  async exportToCSV(tableName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        if (rows.length === 0) {
          resolve('');
          return;
        }

        const headers = Object.keys(rows[0] as object);
        const csvContent = [
          headers.join(','),
          ...rows.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
        ].join('\n');

        resolve(csvContent);
      });
    });
  }

  // Методы для работы с МФУ
  async getMFUDevices(): Promise<MFUDevice[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM mfu ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as MFUDevice[]);
      });
    });
  }

  async addMFUDevice(device: Omit<MFUDevice, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO mfu (model, serial_number, user, department, status, category, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [device.model, device.serial_number, device.user, device.department, device.status, device.category, device.price],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateMFUDevice(id: number, device: Partial<MFUDevice>): Promise<void> {
    const fields = Object.keys(device).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(field => device[field as keyof MFUDevice]);
    values.push(id);

    const query = `UPDATE mfu SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Методы для работы с серверным оборудованием
  async getServerDevices(): Promise<ServerDevice[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM serverEquipment ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as ServerDevice[]);
      });
    });
  }

  async addServerDevice(device: Omit<ServerDevice, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO serverEquipment (model, serial_number, user, department, status, category, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [device.model, device.serial_number, device.user, device.department, device.status, device.category, device.price],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateServerDevice(id: number, device: Partial<ServerDevice>): Promise<void> {
    const fields = Object.keys(device).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(field => device[field as keyof ServerDevice]);
    values.push(id);

    const query = `UPDATE serverEquipment SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const database = new Database(); 