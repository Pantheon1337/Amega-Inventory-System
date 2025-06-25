import { SERVER_URL } from './config';
// Импортируем конфигурацию (будет доступна после сборки)
// В продакшене используем window.location.origin, в разработке - localhost
const API_URL = SERVER_URL;

async function getAll(table: string) {
  const res = await fetch(`${API_URL}/api/${table}`);
  return res.json();
}
async function getById(table: string, id: number | string) {
  const res = await fetch(`${API_URL}/api/${table}/${id}`);
  return res.json();
}
async function create(table: string, data: any) {
  const res = await fetch(`${API_URL}/api/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function update(table: string, id: number | string, data: any) {
  const res = await fetch(`${API_URL}/api/${table}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function remove(table: string, id: number | string) {
  const res = await fetch(`${API_URL}/api/${table}/${id}`, {
    method: 'DELETE' });
  return res.json();
}

export const api = {
  getAll,
  getById,
  create,
  update,
  remove,
}; 