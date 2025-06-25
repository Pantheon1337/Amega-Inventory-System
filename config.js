// Конфигурация сервера и проекта
const config = {
  // Настройки сервера
  server: {
    host: 'localhost',
    port: 3001,
    url: 'http://localhost:3001'
  },
  
  // Настройки фронтенда
  frontend: {
    host: 'localhost',
    port: 3000,
    url: 'http://localhost:3000'
  },
  
  // Настройки базы данных
  database: {
    file: './db.json',
    backupDir: './backups'
  },
  
  // Настройки WebSocket
  websocket: {
    cors: {
      origin: '*'
    }
  },
  
  // Настройки статических файлов
  static: {
    buildDir: './build',
    backupsPath: '/backups'
  },
  
  // Настройки CORS
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  // Настройки логирования
  logging: {
    enabled: true,
    level: 'info' // 'error', 'warn', 'info', 'debug'
  }
};

module.exports = config; 