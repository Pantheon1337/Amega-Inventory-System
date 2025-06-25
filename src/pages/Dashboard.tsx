import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  Users, 
  Package, 
  Printer, 
  Server, 
  TrendingUp, 
  Activity,
  Grid,
  List,
  Search,
  Filter,
  Download,
  Database,
  FileText,
  Wifi, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { Statistics, HistoryRecord, Device, NetworkDevice, StorageItem, MFUDevice, ServerDevice } from '../types';
import { api } from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';
import * as XLSX from 'xlsx';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} сек. назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return date.toLocaleDateString();
}

const Dashboard: React.FC = () => {
  const { role } = useUser();
  const [stats, setStats] = useState<Statistics>({
    total_devices: 0,
    devices_in_use: 0,
    devices_in_storage: 0,
    devices_personal_use: 0,
    devices_repair: 0,
    devices_broken: 0,
    total_mfu: 0,
    mfu_in_use: 0,
    mfu_in_storage: 0,
    total_server: 0,
    server_in_use: 0,
    server_in_storage: 0,
    total_network_devices: 0,
    network_devices_online: 0,
    total_storage_items: 0,
    storage_categories: 0,
  });
  const [recentActivity, setRecentActivity] = useState<HistoryRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [mfuDevices, setMfuDevices] = useState<MFUDevice[]>([]);
  const [serverDevices, setServerDevices] = useState<ServerDevice[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [pieData, setPieData] = useState<any[]>([]);
  const [backups, setBackups] = useState<{ key: string; date: string; time: string; size: string; devicesCount: number }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Начинаем загрузку данных...');
        const [devs, netDevs, storItems, history, mfu, server] = await Promise.all([
          api.getAll('devices'),
          api.getAll('networkDevices'),
          api.getAll('storageItems'),
          api.getAll('history'),
          api.getAll('mfu'),
          api.getAll('serverEquipment')
        ]);
        console.log('Загружено устройств:', devs.length);
        console.log('Загружено сетевых устройств:', netDevs.length);
        console.log('Загружено складских позиций:', storItems.length);
        console.log('Загружено МФУ:', mfu.length);
        console.log('Загружено серверного оборудования:', server.length);
        console.log('Загружено записей истории:', history.length);
        setDevices(devs);
        setNetworkDevices(netDevs);
        setStorageItems(storItems);
        setMfuDevices(mfu);
        setServerDevices(server);
        setRecentActivity(
          history
            .sort((a: HistoryRecord, b: HistoryRecord) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, 10)
        );
        // Логируем складские позиции
        console.log('storageItems:', storItems);
        const newStats: Statistics = {
          total_devices: devs.length,
          devices_in_use: devs.filter((d: Device) => d.status === 'in_use').length,
          devices_in_storage: devs.filter((d: Device) => d.status === 'storage').length,
          devices_personal_use: devs.filter((d: Device) => d.status === 'personal_use').length,
          devices_repair: devs.filter((d: Device) => d.status === 'repair').length,
          devices_broken: devs.filter((d: Device) => d.status === 'broken').length,
          total_mfu: mfu.length,
          mfu_in_use: mfu.filter((d: MFUDevice) => d.status === 'in_use').length,
          mfu_in_storage: mfu.filter((d: MFUDevice) => d.status === 'storage').length,
          total_server: server.length,
          server_in_use: server.filter((d: ServerDevice) => d.status === 'in_use').length,
          server_in_storage: server.filter((d: ServerDevice) => d.status === 'storage').length,
          total_network_devices: netDevs.length,
          network_devices_online: netDevs.filter((d: NetworkDevice) => d.status === 'online').length,
          total_storage_items: storItems.length,
          storage_categories: new Set(storItems.map((i: StorageItem) => i.category)).size
        };
        console.log('Новая статистика:', newStats);
        setStats(newStats);
        
        // Считаем общую стоимость всех категорий
        let totalCostValue = 0;
        
        // Стоимость устройств
        devs.forEach((device: Device) => {
          const deviceTotalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
          totalCostValue += deviceTotalCost;
        });
        
        // Стоимость МФУ
        mfu.forEach((device: MFUDevice) => {
          if (device.price) totalCostValue += device.price;
        });
        
        // Стоимость серверного оборудования
        server.forEach((device: ServerDevice) => {
          let serverTotalCost = device.price || 0;
          
          // Добавляем стоимость дисков
          if (device.hard_disks_details && device.hard_disks_details.length > 0) {
            // Если есть детальная информация о дисках
            const disksCost = device.hard_disks_details.reduce((sum, disk) => 
              sum + (disk.count * disk.price), 0
            );
            serverTotalCost += disksCost;
          } else if (device.hard_disk_count && device.hard_disk_price) {
            // Если есть общая информация о дисках
            serverTotalCost += device.hard_disk_count * device.hard_disk_price;
          }
          
          totalCostValue += serverTotalCost;
        });
        
        // Стоимость складских позиций
        storItems.forEach((item: StorageItem) => {
          if (item.price && item.quantity) totalCostValue += item.price * item.quantity;
        });
        
        setTotalCost(totalCostValue);
        
        // Формируем данные для pie chart - стоимость по категориям
        const pie: any[] = [];
        const costByCategory: Record<string, number> = {};
        
        // Устройства по категориям
        devs.forEach((device: Device) => {
          const cat = device.category || 'Устройства';
          if (!costByCategory[cat]) costByCategory[cat] = 0;
          const deviceTotalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
          costByCategory[cat] += deviceTotalCost;
        });
        
        // МФУ по категориям
        mfu.forEach((device: MFUDevice) => {
          const cat = device.category || 'МФУ';
          if (!costByCategory[cat]) costByCategory[cat] = 0;
          costByCategory[cat] += device.price || 0;
        });
        
        // Серверное оборудование по категориям
        server.forEach((device: ServerDevice) => {
          const cat = device.category || 'Серверное оборудование';
          if (!costByCategory[cat]) costByCategory[cat] = 0;
          
          let serverTotalCost = device.price || 0;
          
          // Добавляем стоимость дисков
          if (device.hard_disks_details && device.hard_disks_details.length > 0) {
            // Если есть детальная информация о дисках
            const disksCost = device.hard_disks_details.reduce((sum, disk) => 
              sum + (disk.count * disk.price), 0
            );
            serverTotalCost += disksCost;
          } else if (device.hard_disk_count && device.hard_disk_price) {
            // Если есть общая информация о дисках
            serverTotalCost += device.hard_disk_count * device.hard_disk_price;
          }
          
          costByCategory[cat] += serverTotalCost;
        });
        
        // Складские позиции по категориям
        storItems.forEach((item: StorageItem) => {
          const cat = item.category && item.category.trim() ? item.category : 'Склад';
          if (!costByCategory[cat]) costByCategory[cat] = 0;
          costByCategory[cat] += (item.price || 0) * (item.quantity || 0);
        });
        
        // Сетевые устройства
        if (netDevs.length > 0) {
          costByCategory['Сетевые устройства'] = 0; // Пока без цены для сетевых устройств
        }
        
        Object.entries(costByCategory).forEach(([cat, value]) => {
          if (value > 0) {
            pie.push({ name: cat, value });
          }
        });
        
        setPieData(pie);
        // Логируем pieData
        console.log('pieData:', pie);
        console.log('costByCategory:', costByCategory);
        console.log('Загрузка данных завершена успешно');
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    }
    loadData();

    // Подписка на WebSocket для автообновления
    const handleDBUpdate = () => {
      loadData();
    };
    subscribeToDBUpdates(handleDBUpdate);
    return () => unsubscribeFromDBUpdates(handleDBUpdate);
  }, []);

  const quickActions = [
    {
      title: 'Устройства',
      description: 'Управление ПК и ноутбуками',
      icon: Monitor,
      href: '/devices',
      color: 'bg-blue-500',
      stats: `${stats.total_devices} устройств`
    },
    {
      title: 'МФУ',
      description: 'Многофункциональные устройства',
      icon: Printer,
      href: '/mfu',
      color: 'bg-orange-500',
      stats: `${mfuDevices.length} устройств`
    },
    {
      title: 'Серверное оборудование',
      description: 'Серверы, NAS, СХД, видеонаблюдение',
      icon: Server,
      href: '/server-equipment',
      color: 'bg-red-500',
      stats: `${serverDevices.length} устройств`
    },
    {
      title: 'Склад',
      description: 'Складские позиции и инвентарь',
      icon: Package,
      href: '/storage',
      color: 'bg-green-500',
      stats: `${stats.total_storage_items} позиций`
    },
    {
      title: 'Сеть',
      description: 'Сетевое оборудование',
      icon: Wifi,
      href: '/network',
      color: 'bg-purple-500',
      stats: `${stats.total_network_devices} устройств`
    },
  ];

  function getActivityIcon(action: string) {
    if (action === 'create') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (action === 'update') return <Clock className="w-4 h-4 text-blue-500" />;
    if (action === 'delete') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  }

  function getActivityText(record: HistoryRecord) {
    switch (record.action) {
      case 'create':
        return `Добавлена запись в ${getTableLabel(record.table_name)}`;
      case 'update':
        return `Изменена запись в ${getTableLabel(record.table_name)}`;
      case 'delete':
        return `Удалена запись из ${getTableLabel(record.table_name)}`;
      default:
        return 'Действие';
    }
  }

  function getTableLabel(table: string) {
    switch (table) {
      case 'devices': return 'Устройства';
      case 'network_devices': return 'Сетевые устройства';
      case 'storage_items': return 'Склад';
      case 'mfu': return 'МФУ';
      case 'serverEquipment': return 'Серверное оборудование';
      default: return table;
    }
  }

  function getRecordName(record: HistoryRecord): string {
    if (record.table_name === 'devices') {
      const d = devices.find(d => String(d.id) === String(record.record_id));
      return d ? d.name : '';
    }
    if (record.table_name === 'network_devices') {
      const d = networkDevices.find(d => String(d.id) === String(record.record_id));
      return d ? d.name : '';
    }
    if (record.table_name === 'storage_items') {
      const d = storageItems.find(d => String(d.id) === String(record.record_id));
      return d ? d.name : '';
    }
    if (record.table_name === 'mfu') {
      const d = mfuDevices.find(d => String(d.id) === String(record.record_id));
      return d ? d.model : '';
    }
    if (record.table_name === 'serverEquipment') {
      const d = serverDevices.find(d => String(d.id) === String(record.record_id));
      return d ? d.model : '';
    }
    return '';
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF69B4', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

  console.log('pieData:', pieData);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Главная панель
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Обзор системы учета оборудования
          </p>
        </div>
      </div>

      {/* Инструкция */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Инструкция по работе с системой
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Добавление оборудования</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Используйте соответствующие разделы для добавления новых устройств, сетевого оборудования или складских позиций.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Отслеживание статуса</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Все изменения автоматически записываются в историю. Используйте фильтры для поиска нужного оборудования.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Экспорт данных</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  В каждом разделе доступен экспорт данных в CSV формат для дальнейшей обработки.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">QR-коды</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Для каждого оборудования генерируется QR-код для быстрого доступа к информации.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Быстрый доступ
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="card p-6 hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {action.description}
                </p>
                <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {action.stats}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Стоимость оборудования по категориям</div>
          <div className="text-4xl font-extrabold text-green-600 dark:text-green-400 mb-4">{totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 })}</div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 })} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Общая статистика
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">Всего устройств</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.total_devices}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">В работе</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.devices_in_use}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">В личном использовании</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.devices_personal_use}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">На складе</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.devices_in_storage}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">В ремонте</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.devices_repair}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">Сломанно</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.devices_broken}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">Сетевые устройства</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.total_network_devices}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Printer className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">МФУ</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{mfuDevices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">Серверное оборудование</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{serverDevices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Общая стоимость</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {role === 'admin' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Последние действия
            </h3>
            <Link
              to="/logs"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
            >
              Просмотреть все логи →
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getRecordName(activity)} • {timeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Информация о бэкапах */}
      {role === 'admin' && backups.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Автоматические бэкапы
          </h3>
          <div className="space-y-2">
            {backups.slice(0, 5).map((backup) => (
              <div key={backup.key} className="flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-600 dark:text-gray-400">
                    {backup.date} {backup.time}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {backup.devicesCount} устройств
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-500">
                  {backup.size}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Бэкапы создаются автоматически каждые 3 дня
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 