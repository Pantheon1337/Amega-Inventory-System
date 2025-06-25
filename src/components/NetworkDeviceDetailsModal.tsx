import React from 'react';
import { X } from 'lucide-react';
import { NetworkDevice } from '../types';

interface NetworkDeviceDetailsModalProps {
  device: NetworkDevice;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  switch: 'Коммутатор',
  router: 'Маршрутизатор',
  access_point: 'Точка доступа',
  firewall: 'Файрвол',
  other: 'Другое',
};

const NetworkDeviceDetailsModal: React.FC<NetworkDeviceDetailsModalProps> = ({ device, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'personal_use':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'repair':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'broken':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Онлайн';
      case 'offline':
        return 'Оффлайн';
      case 'personal_use':
        return 'Личное использование';
      case 'repair':
        return 'В ремонте';
      case 'broken':
        return 'Неисправно';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto modal-scrollbar">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Подробная информация о сетевом устройстве
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Инвентарный номер
              </label>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {device.inventory_number}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Модель
              </label>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {device.model || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Серийный номер
              </label>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {device.serial_number || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                IP адрес
              </label>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {device.ip_address}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                MAC адрес
              </label>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {device.mac_address || '-'}
              </p>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400">Расположение</span>
              <span className="text-gray-900 dark:text-white font-medium">{device.location}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400">Отдел</span>
              <span className="text-gray-900 dark:text-white font-medium">{device.department || '-'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400">Статус</span>
              <span className={getStatusColor(device.status)}>
                {getStatusText(device.status)}
              </span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400">Дата создания</span>
              <span className="text-gray-900 dark:text-white">{new Date(device.created_at).toLocaleString('ru-RU')}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400">Последнее обновление</span>
              <span className="text-gray-900 dark:text-white">{new Date(device.updated_at).toLocaleString('ru-RU')}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkDeviceDetailsModal; 