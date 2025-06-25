import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Download,
  QrCode,
  Package,
  Image as ImageIcon,
  Monitor,
  Eye,
  Printer,
  Server,
  Grid,
  List
} from 'lucide-react';
import { StorageItem, HistoryRecord, Device, MFUDevice, ServerDevice } from '../types';
import StorageItemModal from '../components/StorageItemModal';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import MFUDetailsModal from '../components/MFUDetailsModal';
import ServerEquipmentDetailsModal from '../components/ServerEquipmentDetailsModal';
import QRModal from '../components/QRModal';
import StorageQRModal from '../components/StorageQRModal';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';
import { api } from '../api';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';
import * as XLSX from 'xlsx';

const Storage: FC = () => {
  const { role } = useUser();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [mfuDevices, setMfuDevices] = useState<MFUDevice[]>([]);
  const [serverDevices, setServerDevices] = useState<ServerDevice[]>([]);
  const [filteredItems, setFilteredItems] = useState<StorageItem[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [filteredMfuDevices, setFilteredMfuDevices] = useState<MFUDevice[]>([]);
  const [filteredServerDevices, setFilteredServerDevices] = useState<ServerDevice[]>([]);
  const [filteredBrokenDevices, setFilteredBrokenDevices] = useState<Device[]>([]);
  const [filteredRepairDevices, setFilteredRepairDevices] = useState<Device[]>([]);
  const [filteredBrokenMfu, setFilteredBrokenMfu] = useState<MFUDevice[]>([]);
  const [filteredRepairMfu, setFilteredRepairMfu] = useState<MFUDevice[]>([]);
  const [filteredBrokenServer, setFilteredBrokenServer] = useState<ServerDevice[]>([]);
  const [filteredRepairServer, setFilteredRepairServer] = useState<ServerDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeviceQRModalOpen, setIsDeviceQRModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMfuDetailsModalOpen, setIsMfuDetailsModalOpen] = useState(false);
  const [isServerDetailsModalOpen, setIsServerDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedMfuDevice, setSelectedMfuDevice] = useState<MFUDevice | null>(null);
  const [selectedServerDevice, setSelectedServerDevice] = useState<ServerDevice | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'devices' | 'mfu' | 'server' | 'broken' | 'repair'>('items');

  const loadItems = useCallback(async () => {
    const data = await api.getAll('storageItems');
    setItems(data);
    const cats = [...new Set(data.map((item: StorageItem) => item.category))] as string[];
    setCategories(cats);
  }, []);

  const loadDevices = useCallback(async () => {
    const data = await api.getAll('devices');
    setDevices(data.filter((device: Device) => device.status === 'storage'));
  }, []);

  const loadBrokenDevices = useCallback(async () => {
    const data = await api.getAll('devices');
    setFilteredBrokenDevices(data.filter((device: Device) => device.status === 'broken'));
  }, []);

  const loadRepairDevices = useCallback(async () => {
    const data = await api.getAll('devices');
    setFilteredRepairDevices(data.filter((device: Device) => device.status === 'repair'));
  }, []);

  const loadMfuDevices = useCallback(async () => {
    const data = await api.getAll('mfu');
    setMfuDevices(data.filter((device: MFUDevice) => device.status === 'storage'));
  }, []);

  const loadServerDevices = useCallback(async () => {
    const data = await api.getAll('serverEquipment');
    setServerDevices(data.filter((device: ServerDevice) => device.status === 'storage'));
  }, []);

  const loadBrokenMfu = useCallback(async () => {
    const data = await api.getAll('mfu');
    setFilteredBrokenMfu(data.filter((device: MFUDevice) => device.status === 'broken'));
  }, []);

  const loadRepairMfu = useCallback(async () => {
    const data = await api.getAll('mfu');
    setFilteredRepairMfu(data.filter((device: MFUDevice) => device.status === 'repair'));
  }, []);

  const loadBrokenServer = useCallback(async () => {
    const data = await api.getAll('serverEquipment');
    setFilteredBrokenServer(data.filter((device: ServerDevice) => device.status === 'broken'));
  }, []);

  const loadRepairServer = useCallback(async () => {
    const data = await api.getAll('serverEquipment');
    setFilteredRepairServer(data.filter((device: ServerDevice) => device.status === 'repair'));
  }, []);

  const filterItems = useCallback(() => {
    let filtered = items;
    if (searchTerm) {
      filtered = filtered.filter((item: StorageItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item: StorageItem) => item.category === categoryFilter);
    }
    setFilteredItems(filtered);
  }, [items, searchTerm, categoryFilter]);

  const filterDevices = useCallback(() => {
    let filtered = devices;
    if (searchTerm) {
      filtered = filtered.filter((device: Device) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredDevices(filtered);
  }, [devices, searchTerm]);

  const filterMfuDevices = useCallback(() => {
    let filtered = mfuDevices;
    if (searchTerm) {
      filtered = filtered.filter((device: MFUDevice) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.user && device.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredMfuDevices(filtered);
  }, [mfuDevices, searchTerm]);

  const filterServerDevices = useCallback(() => {
    let filtered = serverDevices;
    if (searchTerm) {
      filtered = filtered.filter((device: ServerDevice) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.user && device.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredServerDevices(filtered);
  }, [serverDevices, searchTerm]);

  const filterBrokenMfu = useCallback(() => {
    let filtered = filteredBrokenMfu;
    if (searchTerm) {
      filtered = filtered.filter((device: MFUDevice) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.user && device.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredBrokenMfu(filtered);
  }, [filteredBrokenMfu, searchTerm]);

  const filterRepairMfu = useCallback(() => {
    let filtered = filteredRepairMfu;
    if (searchTerm) {
      filtered = filtered.filter((device: MFUDevice) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.user && device.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredRepairMfu(filtered);
  }, [filteredRepairMfu, searchTerm]);

  const filterBrokenServer = useCallback(() => {
    let filtered = filteredBrokenServer;
    if (searchTerm) {
      filtered = filtered.filter((device: ServerDevice) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.user && device.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredBrokenServer(filtered);
  }, [filteredBrokenServer, searchTerm]);

  const filterRepairServer = useCallback(() => {
    let filtered = filteredRepairServer;
    if (searchTerm) {
      filtered = filtered.filter((device: ServerDevice) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.inventory_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.user && device.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredRepairServer(filtered);
  }, [filteredRepairServer, searchTerm]);

  useEffect(() => {
    loadItems();
    loadDevices();
    loadBrokenDevices();
    loadRepairDevices();
    loadMfuDevices();
    loadServerDevices();
    loadBrokenMfu();
    loadRepairMfu();
    loadBrokenServer();
    loadRepairServer();
  }, [loadItems, loadDevices, loadBrokenDevices, loadRepairDevices, loadMfuDevices, loadServerDevices, loadBrokenMfu, loadRepairMfu, loadBrokenServer, loadRepairServer]);

  useEffect(() => {
    filterItems();
    filterDevices();
    filterMfuDevices();
    filterServerDevices();
    filterBrokenMfu();
    filterRepairMfu();
    filterBrokenServer();
    filterRepairServer();
  }, [filterItems, filterDevices, filterMfuDevices, filterServerDevices, filterBrokenMfu, filterRepairMfu, filterBrokenServer, filterRepairServer]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: StorageItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
      try {
        await api.remove('storageItems', id);
        await api.create('history', {
          table_name: 'storage_items',
          record_id: id,
          action: 'delete',
          user: 'admin',
          timestamp: new Date().toISOString()
        });
        toast.success('Позиция удалена');
      } catch (error) {
        toast.error('Ошибка при удалении позиции');
      }
    }
  };

  const handleShowQR = (item: StorageItem) => {
    setSelectedItem(item);
    setIsQRModalOpen(true);
  };

  const handleShowDeviceQR = (device: Device) => {
    setSelectedDevice(device);
    setIsDeviceQRModalOpen(true);
  };

  const handleShowDeviceDetails = (device: Device) => {
    setSelectedDevice(device);
    setIsDetailsModalOpen(true);
  };

  const handleMoveDeviceToWork = async (device: Device) => {
    try {
      const updatedDevice = { ...device, status: 'in_use', updated_at: new Date().toISOString() };
      await api.update('devices', device.id, updatedDevice);
      await api.create('history', {
        table_name: 'devices',
        record_id: device.id,
        action: 'update',
        field_name: 'status',
        old_value: device.status,
        new_value: 'in_use',
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      toast.success('Устройство возвращено в работу');
      loadDevices();
    } catch (error) {
      toast.error('Ошибка при возврате устройства в работу');
    }
  };

  const handleMoveMfuToWork = async (device: MFUDevice) => {
    try {
      const updatedDevice = { ...device, status: 'in_use', updated_at: new Date().toISOString() };
      await api.update('mfu', device.id, updatedDevice);
      toast.success('МФУ возвращено в работу');
      loadMfuDevices();
    } catch (error) {
      toast.error('Ошибка при возврате МФУ в работу');
    }
  };

  const handleMoveServerToWork = async (device: ServerDevice) => {
    try {
      const updatedDevice = { ...device, status: 'in_use', updated_at: new Date().toISOString() };
      await api.update('serverEquipment', device.id, updatedDevice);
      toast.success('Серверное оборудование возвращено в работу');
      loadServerDevices();
    } catch (error) {
      toast.error('Ошибка при возврате серверного оборудования в работу');
    }
  };

  const handleShowMfuDetails = (device: MFUDevice) => {
    setSelectedMfuDevice(device);
    setIsMfuDetailsModalOpen(true);
  };

  const handleShowServerDetails = (device: ServerDevice) => {
    setSelectedServerDevice(device);
    setIsServerDetailsModalOpen(true);
  };

  const handleSaveItem = async (itemData: Omit<StorageItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedItem) {
      // Edit
      const updatedItem: StorageItem = {
        ...selectedItem,
        ...itemData,
        updated_at: new Date().toISOString()
      };
      await api.update('storageItems', selectedItem.id, updatedItem);
      await api.create('history', {
        table_name: 'storage_items',
        record_id: selectedItem.id,
        action: 'update',
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      toast.success('Позиция обновлена');
    } else {
      // Add
      const newItem: StorageItem = {
        ...itemData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await api.create('storageItems', newItem);
      await api.create('history', {
        table_name: 'storage_items',
        record_id: newItem.id,
        action: 'create',
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      toast.success('Позиция добавлена');
    }
    setIsModalOpen(false);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Кабели': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Аксессуары': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Компьютеры': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Мониторы': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Принтеры': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Подписка на WebSocket для storage_items
  useEffect(() => {
    const handleDBUpdate = (data: any) => {
      if (data.table === 'storageItems' || data.table === 'devices' || data.table === 'history') {
        loadItems();
        loadDevices();
        loadMfuDevices();
        loadServerDevices();
      }
    };
    subscribeToDBUpdates(handleDBUpdate);
    return () => unsubscribeFromDBUpdates(handleDBUpdate);
  }, [loadItems, loadDevices, loadMfuDevices, loadServerDevices]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Экспорт складских позиций
    if (filteredItems.length > 0) {
      const headers = [
        'Название',
        'Категория',
        'Количество',
        'Ответственный',
        'Последняя проверка',
        'Дата создания',
        'Последнее обновление'
      ];
      
      const data = filteredItems.map(item => [
        item.name,
        item.category,
        item.quantity,
        item.responsible_person,
        item.last_check_date ? new Date(item.last_check_date).toLocaleDateString('ru-RU') : '-',
        new Date(item.created_at).toLocaleDateString('ru-RU'),
        new Date(item.updated_at).toLocaleDateString('ru-RU')
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, 'Складские позиции');
    }
    
    // Экспорт устройств на складе
    if (filteredDevices.length > 0) {
      const headers = [
        'Название',
        'Инвентарный номер',
        'Модель',
        'Серийный номер',
        'Отдел',
        'Цена',
        'Дата создания',
        'Последнее обновление'
      ];
      
      const data = filteredDevices.map(device => [
        device.name,
        device.inventory_number,
        device.model,
        device.serial_number,
        device.department,
        device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-',
        new Date(device.created_at).toLocaleDateString('ru-RU'),
        new Date(device.updated_at).toLocaleDateString('ru-RU')
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, 'Устройства на складе');
    }
    
    // Экспорт МФУ на складе
    if (filteredMfuDevices.length > 0) {
      const headers = [
        'Категория',
        'Модель',
        'Серийный номер',
        'Цена',
        'Дата создания',
        'Последнее обновление'
      ];

      const data = filteredMfuDevices.map(device => [
        device.category,
        device.model,
        device.serial_number,
        device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-',
        new Date(device.created_at).toLocaleDateString('ru-RU'),
        new Date(device.updated_at).toLocaleDateString('ru-RU')
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, 'МФУ на складе');
    }
    
    // Экспорт серверного оборудования на складе
    if (filteredServerDevices.length > 0) {
      const headers = [
        'Категория',
        'Модель',
        'Серийный номер',
        'Цена',
        'Дата создания',
        'Последнее обновление'
      ];
      
      const data = filteredServerDevices.map(device => [
        device.category,
        device.model,
        device.serial_number,
        device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-',
        new Date(device.created_at).toLocaleDateString('ru-RU'),
        new Date(device.updated_at).toLocaleDateString('ru-RU')
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, 'Серверное оборудование');
    }
    
    XLSX.writeFile(wb, `storage-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Экспорт в Excel завершен');
  };

  // Функция для расчета общей стоимости серверного оборудования
  const calculateServerTotalCost = (device: ServerDevice) => {
    let totalCost = device.price || 0;
    
    // Добавляем стоимость дисков
    if (device.hard_disks_details && device.hard_disks_details.length > 0) {
      // Если есть детальная информация о дисках
      const disksCost = device.hard_disks_details.reduce((sum, disk) => 
        sum + (disk.count * disk.price), 0
      );
      totalCost += disksCost;
    } else if (device.hard_disk_count && device.hard_disk_price) {
      // Если есть общая информация о дисках
      totalCost += device.hard_disk_count * device.hard_disk_price;
    }
    
    return totalCost;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Склад
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Управление складскими позициями и устройствами на складе
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {/* Переключатель вида отображения */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Плитки"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Таблица"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button onClick={exportToExcel} className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
            <span>Экспорт Excel</span>
            </button>
          
          {role === 'admin' && activeTab === 'items' && (
            <button
              onClick={handleAddItem}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          )}
        </div>
      </div>

      {/* Вкладки */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'items'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Складские позиции ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'devices'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Устройства на складе ({filteredDevices.length})
          </button>
          <button
            onClick={() => setActiveTab('broken')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'broken'
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Сломанно ({filteredBrokenDevices.length + filteredBrokenMfu.length + filteredBrokenServer.length})
          </button>
          <button
            onClick={() => setActiveTab('repair')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'repair'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            В ремонте ({filteredRepairDevices.length + filteredRepairMfu.length + filteredRepairServer.length})
          </button>
          <button
            onClick={() => setActiveTab('mfu')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'mfu'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            МФУ ({filteredMfuDevices.length})
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'server'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Серверное оборудование ({filteredServerDevices.length})
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          {activeTab === 'items' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Найдено: {
              activeTab === 'items' ? filteredItems.length : 
              activeTab === 'devices' ? filteredDevices.length : 
              activeTab === 'broken' ? filteredBrokenDevices.length + filteredBrokenMfu.length + filteredBrokenServer.length :
              activeTab === 'repair' ? filteredRepairDevices.length + filteredRepairMfu.length + filteredRepairServer.length :
              activeTab === 'mfu' ? filteredMfuDevices.length : 
              activeTab === 'server' ? filteredServerDevices.length : 0
            }
          </div>
        </div>
      </div>

      {/* Контент в зависимости от вида отображения */}
      {activeTab === 'items' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Monitor className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowQR(item)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="QR-код"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Количество: {item.quantity}</div>
                      <div>Цена: {item.price ? item.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 }) : '-'}</div>
                      <div>Ответственный: {item.responsible_person}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            {/* Таблица складских позиций */}
          <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Категория</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Количество</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ответственный</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.price} ₽</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.responsible_person}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowQR(item)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="QR-код"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      {role === 'admin' && (
                          <>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                          </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      )}

      {activeTab === 'devices' && (
        viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map((device) => (
            <div key={device.id} className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Изображение */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                <div className="w-full h-48 flex items-center justify-center">
                  <Monitor className="w-12 h-12 text-gray-400" />
                </div>
              </div>

              {/* Информация */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {device.inventory_number}
                  </h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleShowDeviceDetails(device)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Просмотр"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShowDeviceQR(device)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="QR-код"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleMoveDeviceToWork(device)}
                        className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                        title="Перевести в работу"
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(device.category)}`}>
                    {device.category}
                  </span>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Модель: {device.model}</div>
                    <div>Отдел: {device.department}</div>
                    <div>Цена: {(() => {
                      const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                      return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                    })()}</div>
                  </div>

                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      На складе
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            {/* Таблица устройств */}
            <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Устройство</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Отдел</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDevices.map((device, idx) => (
                  <tr key={device.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.inventory_number}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{device.category}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{device.serial_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        На складе
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowDeviceDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowDeviceQR(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="QR-код"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleMoveDeviceToWork(device)}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                            title="Перевести в работу"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'mfu' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMfuDevices.map((device) => (
              <div key={device.id} className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Printer className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.model}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowMfuDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleMoveMfuToWork(device)}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Перевести в работу"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(device.category)}`}>
                      {device.category}
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Инв. номер: <span className="font-mono text-blue-600 dark:text-blue-400">{device.inventory_number}</span></div>
                      <div>Серийный номер: {device.serial_number}</div>
                      <div>Цена: {device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-'}</div>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        На складе
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            {/* Таблица МФУ */}
            <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Устройство</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMfuDevices.map((device, idx) => (
                  <tr key={device.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.category}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">{device.inventory_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        На складе
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowMfuDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleMoveMfuToWork(device)}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                            title="Перевести в работу"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'server' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServerDevices.map((device) => (
              <div key={device.id} className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Server className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.inventory_number}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowServerDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleMoveServerToWork(device)}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Перевести в работу"
                        >
                          <Server className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(device.category)}`}>
                      {device.category}
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Инв. номер: <span className="font-mono text-blue-600 dark:text-blue-400">{device.inventory_number}</span></div>
                      <div>Серийный номер: {device.serial_number}</div>
                      <div>Цена: {(() => {
                        const totalCost = calculateServerTotalCost(device);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}</div>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        На складе
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            {/* Таблица серверного оборудования */}
            <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Устройство</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredServerDevices.map((device, idx) => (
                  <tr key={device.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.category}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">{device.inventory_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        На складе
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const totalCost = calculateServerTotalCost(device);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowServerDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleMoveServerToWork(device)}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                            title="Перевести в работу"
                          >
                            <Server className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'broken' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Сломанные устройства */}
            {filteredBrokenDevices.map((device) => (
              <div key={`device-${device.id}`} className="card overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-red-500">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Monitor className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.name}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowDeviceDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShowDeviceQR(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="QR-код"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Сломанно
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Модель: {device.model || '-'}</div>
                      <div>Пользователь: {device.user}</div>
                      <div>Отдел: {device.department}</div>
                      <div>Общая стоимость: {(() => {
                        const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Сломанные МФУ */}
            {filteredBrokenMfu.map((device) => (
              <div key={`mfu-${device.id}`} className="card overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-red-500">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Printer className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.model}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowMfuDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Сломанно
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Инв. номер: <span className="font-mono text-blue-600 dark:text-blue-400">{device.inventory_number}</span></div>
                      <div>Серийный номер: {device.serial_number}</div>
                      <div>Пользователь: {device.user || '-'}</div>
                      <div>Отдел: {device.department}</div>
                      <div>Цена: {device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Сломанное серверное оборудование */}
            {filteredBrokenServer.map((device) => (
              <div key={`server-${device.id}`} className="card overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-red-500">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Server className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.model}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowServerDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Сломанно
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Инв. номер: <span className="font-mono text-blue-600 dark:text-blue-400">{device.inventory_number}</span></div>
                      <div>Серийный номер: {device.serial_number}</div>
                      <div>Пользователь: {device.user || '-'}</div>
                      <div>Отдел: {device.department}</div>
                      <div>Цена: {(() => {
                        const totalCost = calculateServerTotalCost(device);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            {/* Таблица сломанных устройств */}
            <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Устройство</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Отдел</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Стоимость</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Сломанные устройства */}
                {filteredBrokenDevices.map((device, idx) => (
                  <tr key={`device-${device.id}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Устройство
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Сломанно
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowDeviceDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowDeviceQR(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="QR-код"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Сломанные МФУ */}
                {filteredBrokenMfu.map((device, idx) => (
                  <tr key={`mfu-${device.id}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        МФУ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.category}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Сломанно
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.user || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowMfuDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Сломанное серверное оборудование */}
                {filteredBrokenServer.map((device, idx) => (
                  <tr key={`server-${device.id}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Сервер
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.category}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Сломанно
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.user || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const totalCost = calculateServerTotalCost(device);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowServerDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'repair' && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Устройства в ремонте */}
            {filteredRepairDevices.map((device, idx) => (
              <div key={`device-${device.id}`} className="card overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-orange-500">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Monitor className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.name}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowDeviceDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShowDeviceQR(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="QR-код"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      В ремонте
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Модель: {device.model || '-'}</div>
                      <div>Пользователь: {device.user}</div>
                      <div>Отдел: {device.department}</div>
                      <div>Общая стоимость: {(() => {
                        const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}</div>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        В ремонте
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* МФУ в ремонте */}
            {filteredRepairMfu.map((device, idx) => (
              <div key={`mfu-${device.id}`} className="card overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-orange-500">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Printer className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.model}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowMfuDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleMoveMfuToWork(device)}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Перевести в работу"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(device.category)}`}>
                      {device.category}
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Инв. номер: <span className="font-mono text-blue-600 dark:text-blue-400">{device.inventory_number}</span></div>
                      <div>Серийный номер: {device.serial_number}</div>
                      <div>Цена: {device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-'}</div>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Сломанно
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Серверное оборудование в ремонте */}
            {filteredRepairServer.map((device, idx) => (
              <div key={`server-${device.id}`} className="card overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-orange-500">
                {/* Изображение */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <div className="w-full h-48 flex items-center justify-center">
                    <Server className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Информация */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {device.model}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleShowServerDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleMoveServerToWork(device)}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Перевести в работу"
                        >
                          <Server className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(device.category)}`}>
                      {device.category}
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Инв. номер: <span className="font-mono text-blue-600 dark:text-blue-400">{device.inventory_number}</span></div>
                      <div>Серийный номер: {device.serial_number}</div>
                      <div>Цена: {(() => {
                        const totalCost = calculateServerTotalCost(device);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}</div>
                    </div>

                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Сломанно
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            {/* Таблица устройств в ремонте */}
            <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Устройство</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Отдел</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Стоимость</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRepairDevices.map((device, idx) => (
                  <tr key={`device-${device.id}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Устройство
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        В ремонте
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowDeviceDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowDeviceQR(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="QR-код"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRepairMfu.map((device, idx) => (
                  <tr key={`mfu-${device.id}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        МФУ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.category}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        В ремонте
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.user || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowMfuDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRepairServer.map((device, idx) => (
                  <tr key={`server-${device.id}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Сервер
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{device.category}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        В ремонте
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.user || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const totalCost = calculateServerTotalCost(device);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowServerDetails(device)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Пустое состояние */}
      {activeTab === 'items' && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Позиции не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска или добавьте новую позицию.
          </p>
        </div>
      )}

      {activeTab === 'devices' && filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Устройства не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска или добавьте новое устройство.
          </p>
        </div>
      )}

      {activeTab === 'mfu' && filteredMfuDevices.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            МФУ не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска или добавьте новое МФУ.
          </p>
        </div>
      )}

      {activeTab === 'server' && filteredServerDevices.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Серверное оборудование не найдено
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска или добавьте новое серверное оборудование.
          </p>
        </div>
      )}

      {activeTab === 'broken' && filteredBrokenDevices.length === 0 && filteredBrokenMfu.length === 0 && filteredBrokenServer.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Сломанные устройства не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска.
          </p>
        </div>
      )}

      {activeTab === 'repair' && filteredRepairDevices.length === 0 && filteredRepairMfu.length === 0 && filteredRepairServer.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Устройства в ремонте не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска.
          </p>
        </div>
      )}

      {/* Модальные окна */}
      {isModalOpen && role === 'admin' && (
        <StorageItemModal
          item={selectedItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      {isQRModalOpen && selectedItem && role === 'admin' && (
        <StorageQRModal
          item={selectedItem}
          onClose={() => setIsQRModalOpen(false)}
        />
      )}

      {isDeviceQRModalOpen && selectedDevice && (
        <QRModal
          isOpen={isDeviceQRModalOpen}
          onClose={() => setIsDeviceQRModalOpen(false)}
          data={{
            id: selectedDevice.id,
            name: selectedDevice.name,
            type: 'device',
            user: selectedDevice.user,
            department: selectedDevice.department,
            location: selectedDevice.location,
            office: selectedDevice.office,
          }}
        />
      )}

      {isDetailsModalOpen && selectedDevice && (
        <DeviceDetailsModal
          device={selectedDevice}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}

      {isMfuDetailsModalOpen && selectedMfuDevice && (
        <MFUDetailsModal
          device={selectedMfuDevice}
          onClose={() => setIsMfuDetailsModalOpen(false)}
        />
      )}

      {isServerDetailsModalOpen && selectedServerDevice && (
        <ServerEquipmentDetailsModal
          device={selectedServerDevice}
          onClose={() => setIsServerDetailsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Storage; 