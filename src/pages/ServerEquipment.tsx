import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, Download } from 'lucide-react';
import { ServerDevice } from '../types';
import ServerEquipmentModal from '../components/ServerEquipmentModal';
import ServerEquipmentDetailsModal from '../components/ServerEquipmentDetailsModal';
import toast from 'react-hot-toast';
import { api } from '../api';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';
import { useUser } from '../contexts/UserContext';
import * as XLSX from 'xlsx';

const SERVER_CATEGORIES = ['Сервер', 'NAS', 'СХД', 'Видеорегистратор', 'IP-камера', 'UPS', 'СКУД', 'АТС'];

const ServerEquipment: React.FC = () => {
  const { role } = useUser();
  const [devices, setDevices] = useState<ServerDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<ServerDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_use' | 'storage' | 'personal_use' | 'repair' | 'broken'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<ServerDevice | null>(null);

  const loadDevices = async () => {
    try {
      const data = await api.getAll('serverEquipment');
      setDevices(data);
      setFilteredDevices(data);
    } catch (error) {
      console.error('Ошибка при загрузке серверного оборудования:', error);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    if (filteredDevices.length > 0) {
      const headers = [
        'Название',
        'Инвентарный номер',
        'Категория',
        'Модель',
        'Серийный номер',
        'Статус',
        'Цена',
        'Дата создания',
        'Последнее обновление'
      ];
      
      const data = filteredDevices.map(device => [
        device.name,
        device.inventory_number,
        device.category,
        device.model,
        device.serial_number,
        device.status === 'in_use' ? 'В работе' : 
        device.status === 'storage' ? 'На складе' :
        device.status === 'personal_use' ? 'В личном использовании' :
        device.status === 'repair' ? 'В ремонте' :
        device.status === 'broken' ? 'Сломанно' : device.status,
        device.price ? device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-',
        new Date(device.created_at).toLocaleDateString('ru-RU'),
        new Date(device.updated_at).toLocaleDateString('ru-RU')
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, 'Серверное оборудование');
    }
    
    XLSX.writeFile(wb, `server-equipment-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Экспорт в Excel завершен');
  };

  const filterDevices = useCallback(() => {
    let filtered = devices;
    if (searchTerm) {
      filtered = filtered.filter(device =>
        (device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(device => device.category === categoryFilter);
    }
    setFilteredDevices(filtered);
  }, [devices, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    loadDevices();
    
    const handleDBUpdate = (event: any) => {
      if (event.table === 'serverEquipment' || event.table === 'all') {
        loadDevices();
      }
    };
    
    subscribeToDBUpdates(handleDBUpdate);
    return () => unsubscribeFromDBUpdates(handleDBUpdate);
  }, []);

  useEffect(() => {
    filterDevices();
  }, [filterDevices]);

  const handleAddDevice = () => {
    setSelectedDevice(null);
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: ServerDevice) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleDeleteDevice = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это оборудование?')) {
      try {
        await api.remove('serverEquipment', id);
        setDevices(devices.filter(device => device.id !== id));
        setFilteredDevices(filteredDevices.filter(device => device.id !== id));
      } catch (error) {
        console.error('Ошибка при удалении:', error);
      }
    }
  };

  const handleMoveToStorage = async (device: ServerDevice) => {
    try {
      const updatedDevice: ServerDevice = { ...device, status: 'storage' as const, updated_at: new Date().toISOString() };
      await api.update('serverEquipment', device.id, updatedDevice);
      setDevices(devices.map(d => d.id === device.id ? updatedDevice : d));
      setFilteredDevices(filteredDevices.map(d => d.id === device.id ? updatedDevice : d));
      toast.success('Серверное оборудование перемещено на склад');
    } catch (error) {
      console.error('Ошибка при перемещении серверного оборудования:', error);
    }
  };

  const handleMoveToWork = async (device: ServerDevice) => {
    try {
      const updatedDevice: ServerDevice = { ...device, status: 'in_use' as const, updated_at: new Date().toISOString() };
      await api.update('serverEquipment', device.id, updatedDevice);
      setDevices(devices.map(d => d.id === device.id ? updatedDevice : d));
      setFilteredDevices(filteredDevices.map(d => d.id === device.id ? updatedDevice : d));
      toast.success('Серверное оборудование возвращено в работу');
    } catch (error) {
      console.error('Ошибка при возврате серверного оборудования в работу:', error);
    }
  };

  const handleShowDetails = (device: ServerDevice) => {
    setSelectedDevice(device);
    setIsDetailsModalOpen(true);
  };

  const handleSaveDevice = async (deviceData: Omit<ServerDevice, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (selectedDevice) {
        // Edit
        const updatedDevice: ServerDevice = {
          ...selectedDevice,
          ...deviceData,
          updated_at: new Date().toISOString()
        };
        await api.update('serverEquipment', updatedDevice.id, updatedDevice);
        toast.success('Серверное оборудование обновлено');
      } else {
        // Add
        const newDevice: ServerDevice = {
          ...deviceData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ServerDevice;
        await api.create('serverEquipment', newDevice);
        toast.success('Серверное оборудование добавлено');
      }
      setIsModalOpen(false);
      loadDevices();
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      toast.error('Ошибка при сохранении серверного оборудования');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Серверное оборудование</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление серверами, NAS, СХД, видеорегистраторами, IP-камерами, UPS, СКУД, АТС</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button onClick={exportToExcel} className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Экспорт Excel</span>
          </button>
          {role === 'admin' && (
            <button onClick={handleAddDevice} className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          )}
        </div>
      </div>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="all">Все статусы</option>
            <option value="in_use">В работе</option>
            <option value="storage">На складе</option>
            <option value="personal_use">В личном пользовании</option>
            <option value="repair">В ремонте</option>
            <option value="broken">Сломан</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Все категории</option>
            {SERVER_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Найдено: {filteredDevices.length}
          </div>
        </div>
      </div>
      {filteredDevices.length > 0 && (
        <div>
          <table className="w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Устройство
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Жесткие диски
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Цена
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDevices.map((device, idx) => (
                <tr key={device.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {device.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {device.model}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {device.inventory_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${(() => {
                      switch (device.status) {
                        case 'in_use':
                          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                        case 'storage':
                          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                        case 'personal_use':
                          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                        case 'repair':
                          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                        case 'broken':
                          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                        default:
                          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
                      }
                    })()}`}>
                      {(() => {
                        switch (device.status) {
                          case 'in_use':
                            return 'В работе';
                          case 'storage':
                            return 'На складе';
                          case 'personal_use':
                            return 'В личном использовании';
                          case 'repair':
                            return 'В ремонте';
                          case 'broken':
                            return 'Сломанно';
                          default:
                            return device.status;
                        }
                      })()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {device.hard_disk_size && device.hard_disk_count ? (
                        <div>
                          <div>{device.hard_disk_size} ТБ × {device.hard_disk_count} шт.</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Всего: {(device.hard_disk_size * device.hard_disk_count).toLocaleString()} ТБ
                          </div>
                          {device.hard_disk_price && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {device.hard_disk_price.toLocaleString()} ₽/шт.
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {(() => {
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
                        
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </div>
                    {device.price && (device.hard_disk_count || (device.hard_disks_details && device.hard_disks_details.length > 0)) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Сервер: {device.price.toLocaleString()} ₽
                        {(() => {
                          let disksCost = 0;
                          if (device.hard_disks_details && device.hard_disks_details.length > 0) {
                            disksCost = device.hard_disks_details.reduce((sum, disk) => 
                              sum + (disk.count * disk.price), 0
                            );
                          } else if (device.hard_disk_count && device.hard_disk_price) {
                            disksCost = device.hard_disk_count * device.hard_disk_price;
                          }
                          return disksCost > 0 ? ` | Диски: ${disksCost.toLocaleString()} ₽` : '';
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-end space-x-2">
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
                      {role === 'admin' && device.status === 'in_use' && (
                        <button
                          onClick={() => handleMoveToStorage(device)}
                          className="text-yellow-600 hover:text-yellow-900 dark:hover:text-yellow-400"
                          title="Переместить на склад"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      )}
                      {role === 'admin' && device.status === 'storage' && (
                        <button
                          onClick={() => handleMoveToWork(device)}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          title="Переместить в работу"
                        >
                          <Package className="w-4 h-4" />
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
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Серверное оборудование не найдено
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Попробуйте изменить параметры поиска' 
              : 'Начните с добавления первого серверного оборудования'}
          </p>
        </div>
      )}
      {isModalOpen && (
        <ServerEquipmentModal
          device={selectedDevice}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDevice}
        />
      )}
      {isDetailsModalOpen && selectedDevice && (
        <ServerEquipmentDetailsModal
          device={selectedDevice}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ServerEquipment; 