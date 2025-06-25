import React from 'react';
import { X } from 'lucide-react';
import { ServerDevice } from '../types';

interface ServerEquipmentDetailsModalProps {
  device: ServerDevice;
  onClose: () => void;
}

const ServerEquipmentDetailsModal: React.FC<ServerEquipmentDetailsModalProps> = ({ device, onClose }) => {
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
            Подробная информация о серверном оборудовании
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
                  Категория
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {device.category}
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
              {device.hard_disk_size && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Объем жесткого диска
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.hard_disk_size} ТБ
                  </p>
                </div>
              )}
              {device.hard_disk_count && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Количество жестких дисков
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {device.hard_disk_count} шт.
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
            </div>
          </div>

          {/* Даты */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Даты
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Дата создания
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(device.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Последнее обновление
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(device.updated_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          </div>

          {/* Жесткие диски */}
          {(device.hard_disk_size || device.hard_disk_count) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Жесткие диски
              </h3>
              
              {device.hard_disks_details && device.hard_disks_details.length > 0 ? (
                <div className="space-y-4">
                  {device.hard_disks_details.map((disk, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Диск {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Объем одного диска
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {disk.size} ТБ
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Количество дисков
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {disk.count} шт.
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Стоимость за 1 шт.
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {disk.price.toLocaleString()} ₽
                          </p>
                        </div>
                        {disk.model && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                              Модель
                            </label>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {disk.model}
                            </p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Итого по этому типу
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            Объем: {(disk.size * disk.count).toLocaleString()} ТБ | 
                            Стоимость: {(disk.count * disk.price).toLocaleString()} ₽
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Общая сводка:
                    </h5>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <div>
                        Всего дисков: {device.hard_disks_details.reduce((sum, disk) => sum + disk.count, 0)} шт.
                      </div>
                      <div>
                        Общий объем: {device.hard_disks_details.reduce((sum, disk) => sum + (disk.size * disk.count), 0).toLocaleString()} ТБ
                      </div>
                      <div>
                        Общая стоимость дисков: {device.hard_disks_details.reduce((sum, disk) => sum + (disk.count * disk.price), 0).toLocaleString()} ₽
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {device.hard_disk_size && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Объем одного диска
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {device.hard_disk_size} ТБ
                      </p>
                    </div>
                  )}
                  {device.hard_disk_count && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Количество дисков
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {device.hard_disk_count} шт.
                      </p>
                    </div>
                  )}
                  {device.hard_disk_price && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Стоимость за 1 шт.
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {device.hard_disk_price.toLocaleString()} ₽
                      </p>
                    </div>
                  )}
                  {device.hard_disk_size && device.hard_disk_count && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Общий объем
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {(device.hard_disk_size * device.hard_disk_count).toLocaleString()} ТБ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerEquipmentDetailsModal; 