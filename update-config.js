const fs = require('fs');
const config = require('./config');
 
console.log(`✅ Конфигурация обновлена:`);
console.log(`   - API сервер: ${config.server.url}`);
console.log(`   - Фронтенд: ${config.frontend.url}`); 