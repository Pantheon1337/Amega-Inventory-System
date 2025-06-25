import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package, 
  Download,
  QrCode,
  Eye
} from 'lucide-react';
import { Device } from '../types';
import DeviceModal from '../components/DeviceModal';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import QRModal from '../components/QRModal';
import toast from 'react-hot-toast';
import { api } from '../api';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';
import { useUser } from '../contexts/UserContext';
import * as XLSX from 'xlsx';

const Devices: React.FC = () => {
  const { role } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_use' | 'storage' | 'personal_use' | 'repair' | 'broken'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const loadDevices = async () => {
    try {
      const data = await api.getAll('devices');
      console.log('Загружено устройств с сервера:', data);
      setDevices(data);
      const depts = [...new Set(data.map((d: Device) => String(d.department)))] as string[];
      setDepartments(depts);
    } catch (error: any) {
      console.error('Ошибка при загрузке устройств:', error);
      toast.error('Ошибка при загрузке устройств: ' + (error?.message || error));
    }
  };

  useEffect(() => {
    loadDevices();
    const handleUpdate = (event: any) => {
      console.log('Получено событие db_update:', event);
      if (event.table === 'devices' || event.table === 'all') {
        loadDevices();
      }
    };
    subscribeToDBUpdates(handleUpdate);
    return () => unsubscribeFromDBUpdates(handleUpdate);
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, searchTerm, statusFilter, departmentFilter]);

  const filterDevices = () => {
    let filtered = devices;
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(device => device.department === departmentFilter);
    }
    setFilteredDevices(filtered);
  };

  const handleAddDevice = () => {
    setSelectedDevice(null);
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleDeleteDevice = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это устройство?')) {
      try {
        await api.remove('devices', id);
        toast.success('Устройство удалено');
      } catch (error) {
        toast.error('Ошибка при удалении устройства');
      }
    }
  };

  const handleMoveToStorage = async (device: Device) => {
    try {
      const updatedDevice = { ...device, status: 'storage', updated_at: new Date().toISOString() };
      await api.update('devices', device.id, updatedDevice);
      toast.success('Устройство перемещено на склад');
    } catch (error) {
      toast.error('Ошибка при перемещении устройства');
    }
  };

  const handleMoveToWork = async (device: Device) => {
    try {
      const updatedDevice = { ...device, status: 'in_use', updated_at: new Date().toISOString() };
      await api.update('devices', device.id, updatedDevice);
      toast.success('Устройство возвращено в работу');
    } catch (error) {
      toast.error('Ошибка при возврате устройства в работу');
    }
  };

  const handleShowQR = (device: Device) => {
    setSelectedDevice(device);
    setIsQRModalOpen(true);
  };

  const handleShowDetails = (device: Device) => {
    setSelectedDevice(device);
    setIsDetailsModalOpen(true);
  };

  const handleSaveDevice = async (deviceData: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedDevice) {
      // Edit
      const updatedDevice: Device = {
        ...selectedDevice,
        ...deviceData,
        updated_at: new Date().toISOString()
      };
      await api.update('devices', updatedDevice.id, updatedDevice);
      toast.success('Устройство обновлено');
    } else {
      // Add
      const newDevice: Device = {
        ...deviceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Device;
      await api.create('devices', newDevice);
      toast.success('Устройство добавлено');
    }
    setIsModalOpen(false);
  };

  const exportToExcel = () => {
    const headers = [
      'Название',
      'Инвентарный номер',
      'Модель',
      'Серийный номер',
      'Пользователь',
      'Отдел',
      'Статус',
      'Монитор 1',
      'Монитор 2',
      'Итоговая стоимость',
      'ОС',
    ];
    const data = filteredDevices.map(device => {
      const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
      return [
      device.name,
      device.inventory_number,
      device.model,
      device.serial_number,
      device.user,
      device.department,
        device.status === 'in_use' ? 'В работе' : 
        device.status === 'storage' ? 'На складе' :
        device.status === 'personal_use' ? 'В личном использовании' :
        device.status === 'repair' ? 'В ремонте' :
        device.status === 'broken' ? 'Сломанно' : device.status,
      device.monitor || '',
        device.monitor2 || '',
        totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
        device.os || '',
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Устройства');
    XLSX.writeFile(wb, 'devices.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Устройства
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Управление ПК и ноутбуками
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="all">Все статусы</option>
            <option value="in_use">В работе</option>
            <option value="storage">На складе</option>
            <option value="personal_use">В личном использовании</option>
            <option value="repair">В ремонте</option>
            <option value="broken">Сломанно</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Все отделы</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
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
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Устройство
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Отдел
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Мониторы
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  Итоговая стоимость
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                  ОС
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
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {device.category}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {device.serial_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {device.user || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {device.department}
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
                      {device.monitor && (
                        <div>{device.monitor}</div>
                      )}
                      {device.monitor2 && (
                        <div>{device.monitor2}</div>
                      )}
                      {!device.monitor && !device.monitor2 && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white font-semibold">
                      {(() => {
                        const totalCost = (device.price || 0) + (device.monitor_price || 0) + (device.monitor2_price || 0);
                        return totalCost > 0 ? totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {device.os || '-'}
                    </div>
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
                      <button
                        onClick={() => handleShowQR(device)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Показать QR-код"
                      >
                        <QrCode className="w-4 h-4" />
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
            Устройства не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Попробуйте изменить параметры поиска или добавьте новое устройство.
          </p>
        </div>
      )}

      {/* Модальные окна */}
      {isModalOpen && role === 'admin' && (
        <DeviceModal
          device={selectedDevice}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDevice}
        />
      )}

      {isQRModalOpen && selectedDevice && (
        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
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
    </div>
  );
};

export default Devices;