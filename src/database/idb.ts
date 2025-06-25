import { openDB, DBSchema } from 'idb';
import { Device, NetworkDevice, StorageItem, HistoryRecord, Employee } from '../types';
import { autoSyncToServer } from './remote';

interface InventDB extends DBSchema {
  devices: {
    key: number;
    value: Device;
  };
  network_devices: {
    key: number;
    value: NetworkDevice;
  };
  storage_items: {
    key: number;
    value: StorageItem;
  };
  employees: {
    key: number;
    value: Employee;
  };
  history: {
    key: number;
    value: HistoryRecord;
  };
}

const dbPromise = openDB<InventDB>('invent-db', 3, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('devices', { keyPath: 'id' });
      db.createObjectStore('network_devices', { keyPath: 'id' });
      db.createObjectStore('storage_items', { keyPath: 'id' });
    }
    if (oldVersion < 2) {
      db.createObjectStore('history', { keyPath: 'id' });
    }
    if (oldVersion < 3) {
      db.createObjectStore('employees', { keyPath: 'id' });
    }
  },
});

// Devices
export async function getDevices(): Promise<Device[]> {
  const db = await dbPromise;
  const all = await db.getAll('devices');
  // Миграция: если нет поля user, добавляем его и обновляем запись
  const migrated = await Promise.all(
    all.map(async (dev) => {
      if (typeof dev.user === 'undefined') {
        const updated = { ...dev, user: '' };
        await db.put('devices', updated);
        return updated;
      }
      return dev;
    })
  );
  return migrated;
}

export async function addDevice(device: Device): Promise<void> {
  await (await dbPromise).put('devices', device);
  await autoSyncToServer();
}

export async function updateDevice(device: Device): Promise<void> {
  await (await dbPromise).put('devices', device);
  await autoSyncToServer();
}

export async function deleteDevice(id: number): Promise<void> {
  await (await dbPromise).delete('devices', id);
  await autoSyncToServer();
}

// Network Devices
export async function getNetworkDevices(): Promise<NetworkDevice[]> {
  return (await dbPromise).getAll('network_devices');
}

export async function addNetworkDevice(device: NetworkDevice): Promise<void> {
  await (await dbPromise).put('network_devices', device);
  await autoSyncToServer();
}

export async function updateNetworkDevice(device: NetworkDevice): Promise<void> {
  await (await dbPromise).put('network_devices', device);
  await autoSyncToServer();
}

export async function deleteNetworkDevice(id: number): Promise<void> {
  await (await dbPromise).delete('network_devices', id);
  await autoSyncToServer();
}

// Storage Items
export async function getStorageItems(): Promise<StorageItem[]> {
  return (await dbPromise).getAll('storage_items');
}

export async function addStorageItem(item: StorageItem): Promise<void> {
  await (await dbPromise).put('storage_items', item);
  await autoSyncToServer();
}

export async function updateStorageItem(item: StorageItem): Promise<void> {
  await (await dbPromise).put('storage_items', item);
  await autoSyncToServer();
}

export async function deleteStorageItem(id: number): Promise<void> {
  await (await dbPromise).delete('storage_items', id);
  await autoSyncToServer();
}

// Employees
export async function getEmployees(): Promise<Employee[]> {
  return (await dbPromise).getAll('employees');
}

export async function addEmployee(employee: Employee): Promise<void> {
  await (await dbPromise).put('employees', employee);
  await autoSyncToServer();
}

export async function updateEmployee(employee: Employee): Promise<void> {
  await (await dbPromise).put('employees', employee);
  await autoSyncToServer();
}

export async function deleteEmployee(id: number): Promise<void> {
  await (await dbPromise).delete('employees', id);
  await autoSyncToServer();
}

// History CRUD
export async function getHistory(): Promise<HistoryRecord[]> {
  return (await dbPromise).getAll('history');
}

export async function addHistoryRecord(record: HistoryRecord): Promise<void> {
  await (await dbPromise).put('history', record);
  await autoSyncToServer();
}

export async function clearHistory(): Promise<void> {
  await (await dbPromise).clear('history');
  await autoSyncToServer();
}

// Диагностическая функция для проверки содержимого базы
export async function debugDatabase(): Promise<{
  devices: Device[];
  networkDevices: NetworkDevice[];
  storageItems: StorageItem[];
  employees: Employee[];
  history: HistoryRecord[];
}> {
  const db = await dbPromise;
  const devices = await db.getAll('devices');
  const networkDevices = await db.getAll('network_devices');
  const storageItems = await db.getAll('storage_items');
  const employees = await db.getAll('employees');
  const history = await db.getAll('history');
  
  console.log('=== ДИАГНОСТИКА БАЗЫ ДАННЫХ ===');
  console.log('Устройства:', devices);
  console.log('Сетевые устройства:', networkDevices);
  console.log('Складские позиции:', storageItems);
  console.log('Сотрудники:', employees);
  console.log('История:', history);
  console.log('================================');
  
  return { devices, networkDevices, storageItems, employees, history };
}

// Функция для экспорта всей базы данных в JSON
export const exportDatabaseToJSON = async (): Promise<string> => {
  try {
    const db = await dbPromise;
    
    const [devices, networkDevices, storageItems, employees, history] = await Promise.all([
      db.getAll('devices'),
      db.getAll('network_devices'),
      db.getAll('storage_items'),
      db.getAll('employees'),
      db.getAll('history')
    ]);

    const databaseExport = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        devices,
        networkDevices,
        storageItems,
        employees,
        history
      }
    };

    const jsonString = JSON.stringify(databaseExport, null, 2);
    return jsonString;
  } catch (error) {
    console.error('Ошибка при экспорте базы данных:', error);
    throw error;
  }
};

// Функция для экспорта всей базы данных в CSV
export const exportDatabaseToCSV = async (): Promise<{ [key: string]: string }> => {
  try {
    const db = await dbPromise;
    
    const [devices, networkDevices, storageItems, employees, history] = await Promise.all([
      db.getAll('devices'),
      db.getAll('network_devices'),
      db.getAll('storage_items'),
      db.getAll('employees'),
      db.getAll('history')
    ]);

    const csvFiles: { [key: string]: string } = {};

    // Экспорт устройств
    if (devices.length > 0) {
      const deviceHeaders = Object.keys(devices[0]).join(',');
      const deviceRows = devices.map(device => 
        Object.values(device).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.devices = `${deviceHeaders}\n${deviceRows.join('\n')}`;
    }

    // Экспорт сетевых устройств
    if (networkDevices.length > 0) {
      const networkHeaders = Object.keys(networkDevices[0]).join(',');
      const networkRows = networkDevices.map(device => 
        Object.values(device).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.networkDevices = `${networkHeaders}\n${networkRows.join('\n')}`;
    }

    // Экспорт складских позиций
    if (storageItems.length > 0) {
      const storageHeaders = Object.keys(storageItems[0]).join(',');
      const storageRows = storageItems.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.storageItems = `${storageHeaders}\n${storageRows.join('\n')}`;
    }

    // Экспорт сотрудников
    if (employees.length > 0) {
      const employeeHeaders = Object.keys(employees[0]).join(',');
      const employeeRows = employees.map(employee => 
        Object.values(employee).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.employees = `${employeeHeaders}\n${employeeRows.join('\n')}`;
    }

    // Экспорт истории
    if (history.length > 0) {
      const historyHeaders = Object.keys(history[0]).join(',');
      const historyRows = history.map(record => 
        Object.values(record).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.history = `${historyHeaders}\n${historyRows.join('\n')}`;
    }

    return csvFiles;
  } catch (error) {
    console.error('Ошибка при экспорте базы данных в CSV:', error);
    throw error;
  }
};

// Функция для создания автоматического бэкапа
export const createAutoBackup = async (): Promise<void> => {
  try {
    const jsonData = await exportDatabaseToJSON();
    const now = new Date();
    const timestamp = now.getTime();
    const backupKey = `backup_${timestamp}`;
    
    // Сохраняем бэкап в localStorage
    localStorage.setItem(backupKey, jsonData);
    
    // Ограничиваем количество бэкапов (храним последние 10)
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    if (backupKeys.length > 10) {
      backupKeys.sort();
      const oldestBackup = backupKeys[0];
      localStorage.removeItem(oldestBackup);
    }

    console.log('Автоматический бэкап создан:', backupKey);
  } catch (error) {
    console.error('Ошибка при создании автоматического бэкапа:', error);
  }
};

// Функция для проверки необходимости создания бэкапа
export const checkAndCreateBackup = async (): Promise<void> => {
  try {
    const lastBackupKey = localStorage.getItem('lastBackupDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastBackupKey || lastBackupKey !== today) {
      // Проверяем, прошло ли 3 дня с последнего бэкапа
      if (lastBackupKey) {
        const lastBackupDate = new Date(lastBackupKey);
        const daysDiff = Math.floor((new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 3) {
          await createAutoBackup();
          localStorage.setItem('lastBackupDate', today);
        }
      } else {
        // Первый запуск - создаем бэкап
        await createAutoBackup();
        localStorage.setItem('lastBackupDate', today);
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке бэкапа:', error);
  }
};

// Функция для восстановления из бэкапа
export const restoreFromBackup = async (backupData: string): Promise<void> => {
  try {
    const parsedData = JSON.parse(backupData);
    const db = await dbPromise;
    
    // Очищаем текущую базу данных
    await Promise.all([
      db.clear('devices'),
      db.clear('network_devices'),
      db.clear('storage_items'),
      db.clear('employees'),
      db.clear('history')
    ]);

    // Восстанавливаем данные
    if (parsedData.data.devices) {
      for (const device of parsedData.data.devices) {
        await db.put('devices', device);
      }
    }
    
    if (parsedData.data.networkDevices) {
      for (const device of parsedData.data.networkDevices) {
        await db.put('network_devices', device);
      }
    }
    
    if (parsedData.data.storageItems) {
      for (const item of parsedData.data.storageItems) {
        await db.put('storage_items', item);
      }
    }
    
    if (parsedData.data.employees) {
      for (const employee of parsedData.data.employees) {
        await db.put('employees', employee);
      }
    }
    
    if (parsedData.data.history) {
      for (const record of parsedData.data.history) {
        await db.put('history', record);
      }
    }

    console.log('База данных восстановлена из бэкапа');
  } catch (error) {
    console.error('Ошибка при восстановлении из бэкапа:', error);
    throw error;
  }
};

// Функция для получения списка доступных бэкапов
export const getAvailableBackups = (): { key: string; date: string; time: string; size: string; devicesCount: number }[] => {
  const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
  
  return backupKeys.map(key => {
    const backupData = localStorage.getItem(key);
    const size = backupData ? `${(backupData.length / 1024).toFixed(1)} KB` : '0 KB';
    
    // Извлекаем timestamp из ключа
    const timestampStr = key.replace('backup_', '');
    const timestamp = parseInt(timestampStr);
    const dateTime = new Date(timestamp);
    
    const date = dateTime.toLocaleDateString('ru-RU');
    const time = dateTime.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Подсчитываем количество устройств в бэкапе
    let devicesCount = 0;
    if (backupData) {
      try {
        const parsedData = JSON.parse(backupData);
        if (parsedData.data) {
          devicesCount = (parsedData.data.devices?.length || 0) + 
                        (parsedData.data.networkDevices?.length || 0) + 
                        (parsedData.data.storageItems?.length || 0) +
                        (parsedData.data.employees?.length || 0);
        }
      } catch (error) {
        console.error('Ошибка при парсинге бэкапа:', error);
      }
    }
    
    return {
      key,
      date,
      time,
      size,
      devicesCount
    };
  }).sort((a, b) => {
    // Сортируем по timestamp (новые сначала)
    const timestampA = parseInt(a.key.replace('backup_', ''));
    const timestampB = parseInt(b.key.replace('backup_', ''));
    return timestampB - timestampA;
  });
};

// Функция для импорта бэкапа из файла
export const importBackupFromFile = async (backupData: string): Promise<void> => {
  try {
    const parsedData = JSON.parse(backupData);
    
    if (!parsedData.data || !parsedData.exportDate) {
      throw new Error('Неверный формат файла бэкапа');
    }

    // Создаем ключ для бэкапа на основе даты экспорта
    const exportDate = new Date(parsedData.exportDate);
    const timestamp = exportDate.getTime();
    const backupKey = `backup_${timestamp}`;
    
    // Сохраняем бэкап в localStorage
    localStorage.setItem(backupKey, backupData);
    
    // Восстанавливаем данные в базу
    await restoreFromBackup(backupData);
    
    console.log('Бэкап импортирован и сохранен:', backupKey);
  } catch (error) {
    console.error('Ошибка при импорте бэкапа:', error);
    throw error;
  }
}; 