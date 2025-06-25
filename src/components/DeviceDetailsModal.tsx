import React from 'react';
import { X, Monitor, Cpu, HardDrive, Database } from 'lucide-react';
import { Device } from '../types';

interface DeviceDetailsModalProps {
  device: Device;
  onClose: () => void;
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({ device, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_use':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'storage':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
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
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto modal-scrollbar">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Подробная информация об устройстве
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Основная информация
            </h3>
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
                  {device.model}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Серийный номер
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {device.serial_number}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Категория
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {device.category}
                </p>
              </div>
              {device.price && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Цена
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                  </p>
                </div>
              )}
              {device.os && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    ОС
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.os}
                  </p>
                </div>
              )}
              {device.office && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Офис (Microsoft Office)
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.office}
                  </p>
                </div>
              )}
              {device.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Локация
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Статус и назначение */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Статус и назначение
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Статус
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                  {getStatusText(device.status)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Отдел
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {device.department}
                </p>
              </div>
              {device.user && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Пользователь
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.user}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Технические характеристики (для ПК и ноутбуков) */}
          {(device.category === 'ПК' || device.category === 'Ноутбук') && (device.cpu || device.ram || device.drives || device.gpu) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Технические характеристики
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {device.cpu && (
                  <div className="flex items-start space-x-3">
                    <Cpu className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Процессор
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {device.cpu}
                      </p>
                    </div>
                  </div>
                )}
                {device.ram && (
                  <div className="flex items-start space-x-3">
                    <Database className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Оперативная память
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {device.ram}
                      </p>
                    </div>
                  </div>
                )}
                {device.drives && (
                  <div className="flex items-start space-x-3">
                    <HardDrive className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Накопители
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {device.drives}
                      </p>
                    </div>
                  </div>
                )}
                {device.gpu && (
                  <div className="flex items-start space-x-3">
                    <Cpu className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Видеокарта
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {device.gpu}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Мониторы */}
          {(device.monitor || device.monitor2) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {device.category === 'Ноутбук' ? 'Внешние мониторы' : 'Мониторы'}
              </h3>
              <div className="space-y-3">
                {device.monitor && (
                  <div className="flex items-start space-x-3">
                    <Monitor className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        {device.category === 'Ноутбук' ? 'Внешний монитор 1' : 'Основной монитор'}
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {device.monitor}
                      </p>
                      {device.monitor_price && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Цена: {device.monitor_price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {device.monitor2 && (
                  <div className="flex items-start space-x-3">
                    <Monitor className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        {device.category === 'Ноутбук' ? 'Внешний монитор 2' : 'Дополнительный монитор'}
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {device.monitor2}
                      </p>
                      {device.monitor2_price && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Цена: {device.monitor2_price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Информация о встроенном экране для ноутбуков */}
              {device.category === 'Ноутбук' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💻 Ноутбук имеет встроенный экран
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Метаданные */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Метаданные
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Дата создания
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(device.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Последнее обновление
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(device.updated_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
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

export default DeviceDetailsModal; 