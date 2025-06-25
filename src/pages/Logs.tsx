import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Plus,
  Shield
} from 'lucide-react';
import { HistoryRecord, Device, NetworkDevice, StorageItem } from '../types';
import { api } from '../api';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';
import { useUser } from '../contexts/UserContext';
import * as XLSX from 'xlsx';

const Logs: React.FC = () => {
  const { role } = useUser();
  
  // Все хуки должны быть в начале компонента
  const [logs, setLogs] = useState<HistoryRecord[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<HistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [devices, setDevices] = useState<Device[]>([]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);

  const loadData = async () => {
    try {
      const [history, devs, netDevs, storItems] = await Promise.all([
        api.getAll('history'),
        api.getAll('devices'),
        api.getAll('networkDevices'),
        api.getAll('storageItems')
      ]);
      
      setLogs(history.sort((a: HistoryRecord, b: HistoryRecord) => b.timestamp.localeCompare(a.timestamp)));
      setDevices(devs);
      setNetworkDevices(netDevs);
      setStorageItems(storItems);
    } catch (error) {
      console.error('Ошибка при загрузке логов:', error);
    }
  };

  const filterLogs = () => {
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => {
        const recordName = getRecordName(log);
        return recordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               log.user.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    if (tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }
    
    setFilteredLogs(filtered);
  };

  useEffect(() => {
    if (role === 'admin') {
      loadData();
      
      // Подписка на WebSocket для обновления логов
      const handleDBUpdate = (data: any) => {
        if (data.table === 'history' || data.table === 'all') {
          loadData();
        }
      };
      
      subscribeToDBUpdates(handleDBUpdate);
      return () => unsubscribeFromDBUpdates(handleDBUpdate);
    }
  }, [role]);

  useEffect(() => {
    if (role === 'admin') {
      filterLogs();
    }
  }, [logs, searchTerm, actionFilter, tableFilter, role]);

  // Проверка доступа - только для администраторов
  if (role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Доступ запрещен
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Страница логов доступна только администраторам системы.
          </p>
        </div>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="w-4 h-4 text-green-500" />;
      case 'update': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'create': return 'Создание';
      case 'update': return 'Изменение';
      case 'delete': return 'Удаление';
      default: return action;
    }
  };

  const getTableLabel = (table: string) => {
    switch (table) {
      case 'devices': return 'Устройства';
      case 'networkDevices': return 'Сетевые устройства';
      case 'storageItems': return 'Склад';
      case 'mfu': return 'МФУ';
      case 'serverEquipment': return 'Серверное оборудование';
      default: return table;
    }
  };

  const getRecordName = (record: HistoryRecord): string => {
    if (record.table_name === 'devices') {
      const d = devices.find(d => String(d.id) === String(record.record_id));
      return d ? d.name : `Устройство #${record.record_id}`;
    }
    if (record.table_name === 'networkDevices') {
      const d = networkDevices.find(d => String(d.id) === String(record.record_id));
      return d ? d.name : `Сетевое устройство #${record.record_id}`;
    }
    if (record.table_name === 'storageItems') {
      const d = storageItems.find(d => String(d.id) === String(record.record_id));
      return d ? d.name : `Складская позиция #${record.record_id}`;
    }
    return `Запись #${record.record_id}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToExcel = () => {
    const data = filteredLogs.map(log => ({
      'Дата/Время': formatDate(log.timestamp),
      'Действие': getActionText(log.action),
      'Таблица': getTableLabel(log.table_name),
      'Запись': getRecordName(log),
      'Пользователь': log.user,
      'Поле': log.field_name || '-',
      'Старое значение': log.old_value || '-',
      'Новое значение': log.new_value || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Логи');
    
    // Автоподбор ширины колонок
    const colWidths = [
      { wch: 20 }, // Дата/Время
      { wch: 12 }, // Действие
      { wch: 15 }, // Таблица
      { wch: 30 }, // Запись
      { wch: 15 }, // Пользователь
      { wch: 15 }, // Поле
      { wch: 20 }, // Старое значение
      { wch: 20 }  // Новое значение
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `логи_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Логи системы
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            История всех изменений в системе
          </p>
        </div>
        {role === 'admin' && (
          <button
            onClick={exportToExcel}
            className="btn-secondary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по записи или пользователю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Все действия</option>
            <option value="create">Создание</option>
            <option value="update">Изменение</option>
            <option value="delete">Удаление</option>
          </select>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Все таблицы</option>
            <option value="devices">Устройства</option>
            <option value="networkDevices">Сетевые устройства</option>
            <option value="storageItems">Склад</option>
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Найдено: {filteredLogs.length}
          </div>
        </div>
      </div>

      {/* Таблица логов */}
      <div className="card p-4">
        <div className="overflow-x-auto table-scrollbar">
          <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Дата/Время</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действие</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Таблица</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Запись</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Детали</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActionText(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {getTableLabel(log.table_name)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {getRecordName(log)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {log.field_name && (
                      <div>
                        <span className="font-medium">{log.field_name}:</span>
                        <br />
                        <span className="text-red-600 dark:text-red-400">{log.old_value || 'пусто'}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600 dark:text-green-400">{log.new_value || 'пусто'}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пустое состояние */}
      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Логи не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logs; 