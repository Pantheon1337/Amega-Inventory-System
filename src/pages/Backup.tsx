import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileText, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Archive,
  RefreshCw,
  Monitor
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';
import { api } from '../api';
import { SERVER_URL } from '../config';

interface BackupInfo {
  name: string;
  timestamp: string;
  size: number;
  filename: string;
}

// Функция для создания бэкапа через API
const createBackup = async (name: string): Promise<void> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create backup');
    }
    
    const result = await response.json();
    console.log('Backup created:', result);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Функция для получения списка бэкапов через API
const getBackups = async (): Promise<BackupInfo[]> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/backups`);
    if (!response.ok) {
      throw new Error('Failed to get backups');
    }
    
    const backups = await response.json();
    return backups.map((backup: any) => ({
      name: backup.name,
      timestamp: backup.timestamp,
      size: backup.size,
      filename: backup.filename
    }));
  } catch (error) {
    console.error('Error getting backups:', error);
    return [];
  }
};

// Функция для восстановления из бэкапа через API
const restoreBackup = async (filename: string): Promise<void> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/restore/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to restore backup');
    }
    
    const result = await response.json();
    console.log('Backup restored:', result);
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
};

// Функция для экспорта серверной базы данных в JSON
const exportServerDatabaseToJSON = async (): Promise<string> => {
  try {
    console.log('Начинаем экспорт серверной базы данных в JSON...');
    
    const [devices, networkDevices, storageItems, employees, history, mfu, serverEquipment] = await Promise.all([
      api.getAll('devices'),
      api.getAll('networkDevices'),
      api.getAll('storageItems'),
      api.getAll('employees'),
      api.getAll('history'),
      api.getAll('mfu'),
      api.getAll('serverEquipment')
    ]);
    
    console.log('Данные для экспорта:', {
      devices: devices?.length || 0,
      networkDevices: networkDevices?.length || 0,
      storageItems: storageItems?.length || 0,
      employees: employees?.length || 0,
      history: history?.length || 0,
      mfu: mfu?.length || 0,
      serverEquipment: serverEquipment?.length || 0
    });
    
    const databaseExport = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        devices: devices || [],
        networkDevices: networkDevices || [],
        storageItems: storageItems || [],
        employees: employees || [],
        history: history || [],
        mfu: mfu || [],
        serverEquipment: serverEquipment || []
      }
    };

    const jsonString = JSON.stringify(databaseExport, null, 2);
    console.log('JSON экспорт завершен, размер:', (jsonString.length / 1024).toFixed(1), 'KB');
    
    return jsonString;
  } catch (error) {
    console.error('Ошибка при экспорте серверной базы данных в JSON:', error);
    throw error;
  }
};

// Функция для экспорта серверной базы данных в CSV
const exportServerDatabaseToCSV = async (): Promise<{ [key: string]: string }> => {
  try {
    console.log('Начинаем экспорт серверной базы данных в CSV...');
    
    const [devices, networkDevices, storageItems, employees, history, mfu, serverEquipment] = await Promise.all([
      api.getAll('devices'),
      api.getAll('networkDevices'),
      api.getAll('storageItems'),
      api.getAll('employees'),
      api.getAll('history'),
      api.getAll('mfu'),
      api.getAll('serverEquipment')
    ]);
    
    const csvFiles: { [key: string]: string } = {};

    console.log('Данные для CSV экспорта:', {
      devices: devices?.length || 0,
      networkDevices: networkDevices?.length || 0,
      storageItems: storageItems?.length || 0,
      employees: employees?.length || 0,
      history: history?.length || 0,
      mfu: mfu?.length || 0,
      serverEquipment: serverEquipment?.length || 0
    });

    // Экспорт устройств
    if (devices && devices.length > 0) {
      const deviceHeaders = Object.keys(devices[0]).join(',');
      const deviceRows = devices.map((device: any) => 
        Object.values(device).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.devices = `${deviceHeaders}\n${deviceRows.join('\n')}`;
      console.log('CSV экспорт устройств создан');
    }

    // Экспорт сетевых устройств
    if (networkDevices && networkDevices.length > 0) {
      const networkHeaders = Object.keys(networkDevices[0]).join(',');
      const networkRows = networkDevices.map((device: any) => 
        Object.values(device).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.networkDevices = `${networkHeaders}\n${networkRows.join('\n')}`;
      console.log('CSV экспорт сетевых устройств создан');
    }

    // Экспорт складских позиций
    if (storageItems && storageItems.length > 0) {
      const storageHeaders = Object.keys(storageItems[0]).join(',');
      const storageRows = storageItems.map((item: any) => 
        Object.values(item).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.storageItems = `${storageHeaders}\n${storageRows.join('\n')}`;
      console.log('CSV экспорт складских позиций создан');
    }

    // Экспорт сотрудников
    if (employees && employees.length > 0) {
      console.log('Создаем CSV экспорт для сотрудников:', employees);
      const employeeHeaders = Object.keys(employees[0]).join(',');
      const employeeRows = employees.map((employee: any) => 
        Object.values(employee).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.employees = `${employeeHeaders}\n${employeeRows.join('\n')}`;
      console.log('CSV экспорт сотрудников создан:', csvFiles.employees);
    } else {
      console.log('Сотрудники не найдены для CSV экспорта');
    }

    // Экспорт истории
    if (history && history.length > 0) {
      const historyHeaders = Object.keys(history[0]).join(',');
      const historyRows = history.map((record: any) => 
        Object.values(record).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.history = `${historyHeaders}\n${historyRows.join('\n')}`;
      console.log('CSV экспорт истории создан');
    }

    // Экспорт МФУ
    if (mfu && mfu.length > 0) {
      const headers = Object.keys(mfu[0]).join(',');
      const rows = mfu.map((item: any) => 
        Object.values(item).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.mfu = `${headers}\n${rows.join('\n')}`;
      console.log('CSV экспорт МФУ создан');
    }

    // Экспорт серверного оборудования
    if (serverEquipment && serverEquipment.length > 0) {
      const headers = Object.keys(serverEquipment[0]).join(',');
      const rows = serverEquipment.map((item: any) => 
        Object.values(item).map((value: any) => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      csvFiles.serverEquipment = `${headers}\n${rows.join('\n')}`;
      console.log('CSV экспорт серверного оборудования создан');
    }

    console.log('CSV экспорт завершен, создано файлов:', Object.keys(csvFiles).length);
    return csvFiles;
  } catch (error) {
    console.error('Ошибка при экспорте серверной базы данных в CSV:', error);
    throw error;
  }
};

// Получить содержимое бэкапа по filename
const fetchBackupContent = async (filename: string): Promise<any> => {
  const response = await fetch(`${SERVER_URL}/backups/${filename}`);
  if (!response.ok) throw new Error('Failed to fetch backup content');
  return response.json();
};

// Удалить бэкап через API
const deleteBackupAPI = async (filename: string): Promise<void> => {
  const response = await fetch(`${SERVER_URL}/api/backup/${filename}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete backup');
};

const Backup: React.FC = () => {
  const { role } = useUser();
  const [backups, setBackups] = useState<(BackupInfo & { devicesCount?: number, details?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [nextBackupDate, setNextBackupDate] = useState<string | null>(null);

  // Загружаем список бэкапов и для каждого считаем количество устройств
  const loadBackups = async () => {
    try {
      const availableBackups = await getBackups();
      const backupsWithCounts = await Promise.all(
        availableBackups.map(async (backup) => {
          try {
            const content = await fetchBackupContent(backup.filename);
            // Fallback: если нет .data, пробуем брать из корня
            const data = content.data || content || {};
            const countDevices = Array.isArray(data.devices) ? data.devices.length : 0;
            const countMFU = Array.isArray(data.mfu) ? data.mfu.length : 0;
            const countServers = Array.isArray(data.serverEquipment) ? data.serverEquipment.length : 0;
            const countNetwork = Array.isArray(data.networkDevices) ? data.networkDevices.length : 0;
            const countStorage = Array.isArray(data.storageItems) ? data.storageItems.length : 0;
            const total = countDevices + countMFU + countServers + countNetwork + countStorage;
            const details = [
              countDevices ? `ПК/Ноут: ${countDevices}` : null,
              countMFU ? `МФУ: ${countMFU}` : null,
              countServers ? `Серверы: ${countServers}` : null,
              countNetwork ? `Сеть: ${countNetwork}` : null,
              countStorage ? `Склад: ${countStorage}` : null
            ].filter(Boolean).join(', ');
            return { ...backup, devicesCount: total, details };
          } catch (e) {
            console.error('Ошибка при получении содержимого бэкапа', backup.filename, e);
            return { ...backup, devicesCount: 0, details: 'Ошибка чтения' };
          }
        })
      );
      setBackups(backupsWithCounts);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Ошибка при загрузке бэкапов');
    }
  };

  const calculateBackupDates = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    setLastBackupDate(today);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextBackupDate(tomorrow.toISOString().split('T')[0]);
  };

  const createManualBackup = async () => {
    if (!window.confirm('Создать новый бэкап базы данных?')) {
      return;
    }

    setIsLoading(true);
    try {
      await createBackup(`manual-backup-${new Date().toISOString()}`);
      await loadBackups();
      calculateBackupDates();
      toast.success('Бэкап создан успешно');
    } catch (error) {
      console.error('Ошибка при создании бэкапа:', error);
      toast.error('Ошибка при создании бэкапа');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJSON = async () => {
    setIsLoading(true);
    try {
      const jsonData = await exportServerDatabaseToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Экспорт в JSON завершен');
    } catch (error) {
      console.error('Ошибка при экспорте в JSON:', error);
      toast.error('Ошибка при экспорте в JSON');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = async () => {
    setIsLoading(true);
    try {
      const csvFiles = await exportServerDatabaseToCSV();
      
      // Создаем ZIP архив с CSV файлами
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      Object.entries(csvFiles).forEach(([tableName, csvContent]) => {
        zip.file(`${tableName}.csv`, csvContent);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Экспорт в CSV завершен');
    } catch (error) {
      console.error('Ошибка при экспорте в CSV:', error);
      toast.error('Ошибка при экспорте в CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const importFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Импортировать данные из файла? Все текущие данные на сервере будут заменены.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Проверяем тип файла
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        throw new Error('Файл должен быть в формате JSON');
      }

      const text = await file.text();
      let parsedData: any;
      
      try {
        parsedData = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Ошибка парсинга JSON файла');
      }
      
      // Проверяем структуру файла
      if (!parsedData.data) {
        throw new Error('Неверный формат файла: отсутствует поле data');
      }

      // Проверяем наличие основных таблиц
      const requiredTables = ['devices', 'networkDevices', 'storageItems', 'employees', 'history', 'mfu', 'serverEquipment'];
      const missingTables = requiredTables.filter(table => !parsedData.data[table]);
      
      if (missingTables.length > 0) {
        console.warn('Отсутствуют некоторые таблицы:', missingTables);
      }

      // Отправляем данные на сервер через правильный API эндпоинт
      const response = await fetch(`${SERVER_URL}/api/db.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData.data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Импорт завершен:', result);
      
      toast.success('Данные успешно импортированы и сохранены на сервер');
      await loadBackups();
      
      // Очищаем input
      event.target.value = '';
    } catch (error) {
      console.error('Ошибка при импорте:', error);
      toast.error(`Ошибка при импорте данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm('Вы уверены, что хотите восстановить базу данных из этого бэкапа? Все текущие данные на сервере будут заменены.')) {
      return;
    }

    setIsLoading(true);
    try {
      await restoreBackup(filename);
      toast.success('База данных восстановлена из бэкапа на сервер');
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при восстановлении:', error);
      toast.error('Ошибка при восстановлении из бэкапа');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!window.confirm('Удалить этот бэкап?')) {
      return;
    }
    setIsLoading(true);
    try {
      await deleteBackupAPI(filename);
      toast.success('Бэкап удален');
      await loadBackups();
    } catch (error) {
      console.error('Ошибка при удалении бэкапа:', error);
      toast.error('Ошибка при удалении бэкапа');
    } finally {
      setIsLoading(false);
    }
  };

  const getBackupStatus = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (lastBackupDate === today) {
      return { status: 'success', message: 'Бэкап создан сегодня', icon: CheckCircle };
    } else if (lastBackupDate) {
      return { status: 'warning', message: 'Бэкап устарел', icon: AlertCircle };
    } else {
      return { status: 'error', message: 'Бэкап не создавался', icon: AlertCircle };
    }
  };

  useEffect(() => {
    loadBackups();
    calculateBackupDates();
  }, []);

  const backupStatus = getBackupStatus();
  const totalBackupSize = backups.reduce((sum, backup) => {
    return sum + backup.size;
  }, 0);

  const totalDevicesInBackups = backups.reduce((sum, backup) => sum + (backup.devicesCount || 0), 0);

  // Проверка доступа - только для администраторов
  if (role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Доступ запрещен
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Страница управления бэкапами доступна только администраторам системы.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление бэкапами
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Резервное копирование и восстановление данных
          </p>
        </div>
        
        <button
          onClick={loadBackups}
          disabled={isLoading}
          className="btn-secondary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Archive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего бэкапов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{backups.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <HardDrive className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Общий размер</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBackupSize.toFixed(1)} KB</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Устройств в бэкапах</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDevicesInBackups}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              backupStatus.status === 'success' ? 'bg-green-100 dark:bg-green-900' :
              backupStatus.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
              'bg-red-100 dark:bg-red-900'
            }`}>
              <backupStatus.icon className={`w-6 h-6 ${
                backupStatus.status === 'success' ? 'text-green-600 dark:text-green-400' :
                backupStatus.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Статус</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{backupStatus.message}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Следующий бэкап</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {nextBackupDate ? new Date(nextBackupDate).toLocaleDateString('ru-RU') : 'Неизвестно'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Действия с бэкапами
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={createManualBackup}
            disabled={isLoading}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Создать бэкап</span>
          </button>

          <button
            onClick={exportToJSON}
            disabled={isLoading}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт JSON</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={isLoading}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Экспорт CSV</span>
          </button>

          <label className="btn-secondary flex items-center justify-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Импорт бэкапа</span>
            <input
              type="file"
              accept=".json"
              onChange={importFromFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Список бэкапов */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Доступные бэкапы
        </h3>
        
        {backups.length === 0 ? (
          <div className="text-center py-8">
            <Archive className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Бэкапы не найдены
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Создайте первый бэкап для защиты данных.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Устройств</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Размер</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {backups.map((backup, idx) => (
                  <tr key={backup.name} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {backup.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(backup.timestamp).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {backup.devicesCount ?? '—'}<br /><span className="text-xs text-gray-500">{backup.details}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {backup.size.toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRestoreBackup(backup.filename)}
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          title="Восстановить"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.filename)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Информация о бэкапах
        </h3>
        
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Автоматические бэкапы создаются каждые 3 дня</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Каждый бэкап создается с уникальным именем (дата и время)</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Хранится максимум 10 последних бэкапов</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span>Бэкапы сохраняются локально в браузере</span>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <span>Рекомендуется регулярно экспортировать бэкапы для дополнительной защиты</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backup; 