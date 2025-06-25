# 🚀 Инструкции по развертыванию

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-username/invent-beta-v1.0.git
cd invent-beta-v1.0
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Запуск в режиме разработки
```bash
# Запуск сервера (порт 3001)
npm run server

# В новом терминале - запуск клиента (порт 3000)
npm start
```

### 4. Доступ к приложению
- **Веб-интерфейс**: http://localhost:3000
- **API сервер**: http://localhost:3001

## Настройка для продакшена

### 1. Изменение IP адресов
Отредактируйте файлы конфигурации:

**`config.js`**:
```javascript
server: {
  host: 'ВАШ_IP_АДРЕС',     // например: '192.168.1.100'
  port: 3001,
  url: 'http://ВАШ_IP_АДРЕС:3001'
},
frontend: {
  host: 'ВАШ_IP_АДРЕС',     // например: '192.168.1.100'
  port: 3000,
  url: 'http://ВАШ_IP_АДРЕС:3000'
}
```

**`src/config.ts`**:
```typescript
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://ВАШ_IP_АДРЕС:3001';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://ВАШ_IP_АДРЕС:3001';
```

### 2. Сборка для продакшена
```bash
# Сборка React приложения
npm run build

# Запуск сервера в продакшн режиме
npm run server:prod
```

### 3. Настройка CORS
В `config.js` обновите CORS настройки:
```javascript
cors: {
  origin: ['http://ВАШ_IP_АДРЕС:3000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

## Демо данные

Проект поставляется с демо-данными:
- **2 устройства** (ПК и ноутбук)
- **1 сетевое устройство** (коммутатор)
- **2 складские позиции** (SSD и RAM)
- **3 сотрудника** (IT отдел и маркетинг)
- **1 МФУ** (принтер)
- **1 сервер** (с дисками)

Все данные анонимизированы и готовы для демонстрации функциональности.

## Переменные окружения

Создайте файл `.env` для настройки:
```env
# Сервер
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001

# База данных
DB_FILE=./db.json
BACKUP_DIR=./backups

# Логирование
LOG_LEVEL=info
```

## Скрипты запуска

```bash
# Быстрый запуск (Linux/Mac)
./start.sh

# Запуск только React
./start-react.sh

# Запуск только сервера
./start-server.sh

# Сборка для продакшена
npm run build

# Запуск в продакшн режиме
npm run server:prod
```

## Безопасность

1. **Измените IP адреса** на ваши реальные
2. **Настройте файрвол** для ограничения доступа
3. **Используйте HTTPS** в продакшене
4. **Регулярно создавайте бэкапы**
5. **Ограничьте CORS** только необходимыми доменами

## Устранение неполадок

### Ошибка "Connection refused"
```bash
# Проверьте, что сервер запущен
ps aux | grep node

# Проверьте порты
netstat -tulpn | grep :3001
netstat -tulpn | grep :3000
```

### CORS ошибки
Убедитесь, что в `config.js` правильные адреса:
```javascript
cors: {
  origin: ['http://ВАШ_IP:3000', 'http://localhost:3000']
}
```

### Проблемы с зависимостями
```bash
# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

## Поддержка

- **Документация**: [README.md](README.md)
- **Issues**: Создавайте issues в репозитории
- **Логи**: Проверяйте консоль браузера и сервера 