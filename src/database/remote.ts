import { exportDatabaseToJSON, restoreFromBackup } from './idb';
import { SERVER_URL } from '../config';

const API_URL = SERVER_URL + '/db.json'; // Используем универсальный адрес сервера

export async function fetchRemoteDB() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Ошибка загрузки базы');
  return res.json();
}

export async function saveRemoteDB(data: any) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  });
  if (!res.ok) throw new Error('Ошибка сохранения базы');
  return res.json();
}

export async function autoSyncToServer() {
  const jsonData = await exportDatabaseToJSON();
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonData,
  });
}

export async function autoSyncFromServer() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Ошибка загрузки базы');
  const remoteDb = await res.json();
  await restoreFromBackup(JSON.stringify(remoteDb));
} 