import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Download,
  QrCode,
  Wifi,
  WifiOff,
  MapPin,
  Eye
} from 'lucide-react';
import { NetworkDevice } from '../types';
import NetworkDeviceModal from '../components/NetworkDeviceModal';
import QRModal from '../components/QRModal';
import NetworkDeviceDetailsModal from '../components/NetworkDeviceDetailsModal';
import toast from 'react-hot-toast';
import { api } from '../api';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';
import { useUser } from '../contexts/UserContext';
import * as XLSX from 'xlsx';

const Network: React.FC = () => {
  const { role } = useUser();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<NetworkDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'personal_use' | 'repair' | 'broken'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [showMap, setShowMap] = useState(false);

  const loadDevices = useCallback(async () => {
    const data = await api.getAll('networkDevices');
    setDevices(data);
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    filterDevices();
  }, [devices, searchTerm, typeFilter, statusFilter]);

  // Подписка на WebSocket для networkDevices
  useEffect(() => {
    const handleDBUpdate = (data: any) => {
      if (data.table === 'networkDevices' || data.table === 'history') {
        loadDevices();
      }
    };
    subscribeToDBUpdates(handleDBUpdate);
    return () => unsubscribeFromDBUpdates(handleDBUpdate);
  }, [loadDevices]);

  const filterDevices = () => {
    let filtered = devices;
    if (searchTerm) {
      filtered = filtered.filter(device =>
        (device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.location?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(device => device.model.toLowerCase().includes(typeFilter));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    setFilteredDevices(filtered);
  };

  const handleAddDevice = () => {
    setSelectedDevice(null);
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleDeleteDevice = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это сетевое устройство?')) {
      try {
        await api.remove('networkDevices', id);
        await api.create('history', {
          table_name: 'network_devices',
          record_id: id,
          action: 'delete',
          user: 'admin',
          timestamp: new Date().toISOString()
        });
        toast.success('Сетевое устройство удалено');
      } catch (error) {
        toast.error('Ошибка при удалении устройства');
      }
    }
  };

  const handleShowQR = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setIsQRModalOpen(true);
  };

  const handleShowDetails = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setIsDetailsModalOpen(true);
  };

  const handleToggleStatus = async (device: NetworkDevice) => {
    try {
      const newStatus: 'online' | 'offline' = device.status === 'online' ? 'offline' : 'online';
      const updatedDevice = { ...device, status: newStatus, updated_at: new Date().toISOString() };
      await api.update('networkDevices', device.id, updatedDevice);
      await api.create('history', {
        table_name: 'network_devices',
        record_id: device.id,
        action: 'update',
        field_name: 'status',
        old_value: device.status,
        new_value: newStatus,
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      toast.success(`Статус изменен на ${newStatus === 'online' ? 'онлайн' : 'оффлайн'}`);
    } catch (error) {
      toast.error('Ошибка при изменении статуса');
    }
  };

  const handleSaveDevice = async (deviceData: Omit<NetworkDevice, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedDevice) {
      // Edit
      const updatedDevice: NetworkDevice = {
        ...selectedDevice,
        ...deviceData,
        updated_at: new Date().toISOString()
      };
      await api.update('networkDevices', selectedDevice.id, updatedDevice);
      await api.create('history', {
        table_name: 'network_devices',
        record_id: selectedDevice.id,
        action: 'update',
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      toast.success('Сетевое устройство обновлено');
    } else {
      // Add
      const newDevice: NetworkDevice = {
        ...deviceData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await api.create('networkDevices', newDevice);
      await api.create('history', {
        table_name: 'network_devices',
        record_id: newDevice.id,
        action: 'create',
        user: 'admin',
        timestamp: new Date().toISOString()
      });
      toast.success('Сетевое устройство добавлено');
    }
    setIsModalOpen(false);
  };

  const exportToCSV = () => {
    const headers = [
      'Название',
      'Инвентарный номер',
      'Модель',
      'IP адрес',
      'MAC адрес',
      'Расположение',
      'Отдел',
      'Статус',
    ];
    const data = filteredDevices.map(device => [
        device.name,
      device.inventory_number,
      device.model,
      device.ip_address,
      device.mac_address,
        device.location,
      device.department,
      device.status === 'online' ? 'Онлайн' : 
      device.status === 'offline' ? 'Оффлайн' :
      device.status === 'personal_use' ? 'Личное использование' :
      device.status === 'repair' ? 'В ремонте' :
      device.status === 'broken' ? 'Неисправно' : device.status,
    ]);
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'network_devices.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const headers = [
      'Название',
      'Инвентарный номер',
      'Модель',
      'IP адрес',
      'MAC адрес',
      'Расположение',
      'Отдел',
      'Статус',
    ];
    const data = filteredDevices.map(device => [
      device.name,
      device.inventory_number,
      device.model,
      device.ip_address,
      device.mac_address,
      device.location,
      device.department,
      device.status === 'online' ? 'Онлайн' : 
      device.status === 'offline' ? 'Оффлайн' :
      device.status === 'personal_use' ? 'Личное использование' :
      device.status === 'repair' ? 'В ремонте' :
      device.status === 'broken' ? 'Неисправно' : device.status,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Сетевые устройства');
    XLSX.writeFile(wb, 'network_devices.xlsx');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'switch': return '🔌';
      case 'router': return '🌐';
      case 'access_point': return '📶';
      case 'firewall': return '🛡️';
      default: return '🔧';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'switch': return 'Коммутатор';
      case 'router': return 'Маршрутизатор';
      case 'access_point': return 'Точка доступа';
      case 'firewall': return 'Файрвол';
      default: return 'Другое';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Сетевые устройства
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Управление сетевым оборудованием
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`btn-secondary flex items-center space-x-2 ${showMap ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : ''}`}
          >
            <MapPin className="w-4 h-4" />
            <span>{showMap ? 'Скрыть схему' : 'Показать схему'}</span>
          </button>
          {role === 'admin' && (
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Экспорт</span>
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={handleAddDevice}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          )}
        </div>
      </div>

      {/* Интерактивная схема */}
      {showMap && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Схема расположения
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map((device) => (
              <div
                key={device.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  device.status === 'online'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
                onClick={() => handleEditDevice(device)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(device.model)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {device.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {device.location}
                      </p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>IP: {device.ip_address}</div>
                  <div>Тип: {getTypeLabel(device.model)}</div>
                </div>
              </div>
            ))}
          </div>
          {filteredDevices.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Нет устройств для отображения на схеме
            </div>
          )}
        </div>
      )}

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
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Все типы</option>
            <option value="switch">Коммутатор</option>
            <option value="router">Маршрутизатор</option>
            <option value="access_point">Точка доступа</option>
            <option value="firewall">Файрвол</option>
            <option value="other">Другое</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="all">Все статусы</option>
            <option value="online">Онлайн</option>
            <option value="offline">Оффлайн</option>
            <option value="personal_use">Личное использование</option>
            <option value="repair">В ремонте</option>
            <option value="broken">Неисправно</option>
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Найдено: {filteredDevices.length}
          </div>
        </div>
      </div>

      {/* Таблица */}
      {filteredDevices.length > 0 && (
        <div>
          <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Устройство
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Инв. номер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP адрес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Расположение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDevices.map((device, idx) => (
                <tr key={device.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {device.inventory_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">{device.ip_address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{device.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      device.status === 'offline' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                      device.status === 'personal_use' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      device.status === 'repair' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {device.status === 'online' ? 'Онлайн' : 
                       device.status === 'offline' ? 'Оффлайн' :
                       device.status === 'personal_use' ? 'Личное использование' :
                       device.status === 'repair' ? 'В ремонте' :
                       device.status === 'broken' ? 'Неисправно' : device.status}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleShowQR(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Показать QR код"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShowDetails(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Подробная информация"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleEditDevice(device)}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDeleteDevice(device.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Wifi className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Сетевые устройства не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска или добавьте новое устройство.
          </p>
        </div>
      )}

      {/* Модальные окна */}
      {isModalOpen && role === 'admin' && (
        <NetworkDeviceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDevice}
          device={selectedDevice}
        />
      )}

      {isQRModalOpen && selectedDevice && (
        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          data={{
            id: selectedDevice.id,
            name: selectedDevice.name,
            type: 'network',
            location: selectedDevice.location,
          }}
        />
      )}

      {isDetailsModalOpen && selectedDevice && (
        <NetworkDeviceDetailsModal
          device={selectedDevice}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Network; 