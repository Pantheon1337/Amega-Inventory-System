// Универсальный конфиг для адреса сервера и сокета
 
// API сервер работает на порту 3001
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || SERVER_URL; 