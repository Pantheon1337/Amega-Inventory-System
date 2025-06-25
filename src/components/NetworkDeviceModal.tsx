import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { NetworkDevice } from '../types';

interface NetworkDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Omit<NetworkDevice, 'id' | 'created_at' | 'updated_at'>) => void;
  device?: NetworkDevice | null;
}

const NetworkDeviceModal: React.FC<NetworkDeviceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  device
}) => {
  const [formData, setFormData] = useState<Omit<NetworkDevice, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    inventory_number: '',
    model: '',
    serial_number: '',
    ip_address: '',
    mac_address: '',
    status: 'online' as 'online' | 'offline' | 'broken' | 'personal_use' | 'repair',
    location: '',
    department: ''
  });

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        inventory_number: device.inventory_number,
        model: device.model,
        serial_number: device.serial_number,
        ip_address: device.ip_address,
        mac_address: device.mac_address,
        status: device.status,
        location: device.location,
        department: device.department
      });
    } else {
      setFormData({
        name: '',
        inventory_number: '',
        model: '',
        serial_number: '',
        ip_address: '',
        mac_address: '',
        status: 'online',
        location: '',
        department: ''
      });
    }
  }, [device]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Генерируем название автоматически
    const generatedName = formData.model ? `${formData.model} (${formData.inventory_number})` : formData.inventory_number;
    
    onSave({
      ...formData,
      name: generatedName
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-scrollbar">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {device ? 'Редактировать сетевое устройство' : 'Добавить сетевое устройство'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Основная информация
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Инвентарный номер */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Инвентарный номер *
                </label>
                <input
                  type="text"
                  name="inventory_number"
                  value={formData.inventory_number}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="SW-00"
                />
              </div>

              {/* Модель */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Модель
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Введите модель устройства"
                />
              </div>

              {/* Серийный номер */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Серийный номер
                </label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Введите серийный номер устройства"
                />
              </div>
            </div>
          </div>

          {/* Сетевая информация */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Сетевая информация
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IP адрес */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IP адрес *
                </label>
                <input
                  type="text"
                  name="ip_address"
                  value={formData.ip_address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="192.168.1.1"
                />
              </div>

              {/* MAC адрес */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MAC адрес
                </label>
                <input
                  type="text"
                  name="mac_address"
                  value={formData.mac_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
            </div>
          </div>

          {/* Расположение и статус */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Расположение и статус
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Расположение */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Расположение *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Кабинет 101, Серверная"
                />
              </div>

              {/* Статус */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Статус
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="online">Онлайн</option>
                  <option value="offline">Оффлайн</option>
                  <option value="broken">Неисправно</option>
                  <option value="personal_use">Личное использование</option>
                  <option value="repair">В ремонте</option>
                </select>
              </div>
            </div>
          </div>

          {/* Отдел */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Отдел
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Отдел"
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {device ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NetworkDeviceModal; 