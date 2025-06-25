import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { ServerDevice } from '../types';

interface ServerEquipmentModalProps {
  device: ServerDevice | null;
  onClose: () => void;
  onSave: (device: Omit<ServerDevice, 'id' | 'created_at' | 'updated_at'>) => void;
}

const ServerEquipmentModal: React.FC<ServerEquipmentModalProps> = ({ device, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<ServerDevice, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    inventory_number: '',
    model: '',
    serial_number: '',
    user: '',
    department: '',
    status: 'storage' as 'in_use' | 'storage' | 'broken' | 'personal_use' | 'repair',
    category: 'Сервер',
    price: 0,
    hard_disk_size: 1,
    hard_disk_count: 1,
    hard_disk_price: 0
  });

  const [hardDisks, setHardDisks] = useState<Array<{
    size: number;
    count: number;
    price: number;
    model?: string;
  }>>([{
    size: 1,
    count: 1,
    price: 0
  }]);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        inventory_number: device.inventory_number,
        model: device.model,
        serial_number: device.serial_number,
        user: device.user || '',
        department: device.department || '',
        status: device.status,
        category: device.category,
        price: device.price || 0,
        hard_disk_size: device.hard_disk_size || 1,
        hard_disk_count: device.hard_disk_count || 1,
        hard_disk_price: device.hard_disk_price || 0
      });
      
      // Загружаем детальную информацию о дисках
      if (device.hard_disks_details && device.hard_disks_details.length > 0) {
        setHardDisks(device.hard_disks_details);
      } else if (device.hard_disk_size && device.hard_disk_count) {
        // Если нет детальной информации, создаем одну запись на основе общих данных
        setHardDisks([{
          size: device.hard_disk_size,
          count: device.hard_disk_count,
          price: device.hard_disk_price || 0
        }]);
      }
    } else {
      setFormData({
        name: '',
        inventory_number: '',
        model: '',
        serial_number: '',
        user: '',
        department: '',
        status: 'storage',
        category: 'Сервер',
        price: 0,
        hard_disk_size: 1,
        hard_disk_count: 1,
        hard_disk_price: 0
      });
      setHardDisks([{
        size: 1,
        count: 1,
        price: 0
      }]);
    }
  }, [device]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Рассчитываем общие значения на основе детальной информации
    const totalSize = hardDisks.reduce((sum, disk) => sum + (disk.size * disk.count), 0);
    const totalCount = hardDisks.reduce((sum, disk) => sum + disk.count, 0);
    const totalPrice = hardDisks.reduce((sum, disk) => sum + (disk.count * disk.price), 0);
    const avgPrice = totalCount > 0 ? totalPrice / totalCount : 0;
    
    // Генерируем название автоматически
    const generatedName = `${formData.category} ${formData.model}`.trim();
    
    const deviceData = {
      ...formData,
      name: generatedName,
      hard_disk_size: totalSize,
      hard_disk_count: totalCount,
      hard_disk_price: avgPrice,
      hard_disks_details: hardDisks
    };
    
    onSave(deviceData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'hard_disk_size', 'hard_disk_count', 'hard_disk_price'].includes(name) ? (value ? parseFloat(value) || 0 : 0) : value
    }));
  };

  const addHardDisk = () => {
    setHardDisks(prev => [...prev, {
      size: 1,
      count: 1,
      price: 0
    }]);
  };

  const removeHardDisk = (index: number) => {
    if (hardDisks.length > 1) {
      setHardDisks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateHardDisk = (index: number, field: 'size' | 'count' | 'price' | 'model', value: string | number) => {
    setHardDisks(prev => prev.map((disk, i) => 
      i === index ? { ...disk, [field]: typeof value === 'number' ? value : value } : disk
    ));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {device ? 'Редактировать серверное оборудование' : 'Добавить серверное оборудование'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Основная информация */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Основная информация
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Инвентарный номер *
                    </label>
                    <input
                      type="text"
                      name="inventory_number"
                      value={formData.inventory_number}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="SW-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Категория *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="Сервер">Сервер</option>
                      <option value="NAS">NAS</option>
                      <option value="СХД">СХД</option>
                      <option value="Видеорегистратор">Видеорегистратор</option>
                      <option value="IP-камера">IP-камера</option>
                      <option value="UPS">UPS</option>
                      <option value="СКУД">СКУД</option>
                      <option value="АТС">АТС</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Модель *
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Dell PowerEdge R740"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Серийный номер *
                    </label>
                    <input
                      type="text"
                      name="serial_number"
                      value={formData.serial_number}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="CN12345678"
                    />
                  </div>
                </div>
              </div>

              {/* Статус и цена */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Статус и цена
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Статус *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="storage">На складе</option>
                      <option value="in_use">В работе</option>
                      <option value="personal_use">В личном использовании</option>
                      <option value="repair">В ремонте</option>
                      <option value="broken">Сломанно</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Цена
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Введите цену"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Жесткие диски */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Жесткие диски
                </h4>
                
                <div className="space-y-4">
                  {hardDisks.map((disk, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          Диск {index + 1}
                        </h5>
                        {hardDisks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHardDisk(index)}
                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Объем (ТБ)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="28"
                              step="1"
                              value={disk.size}
                              onChange={(e) => updateHardDisk(index, 'size', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                              {disk.size} ТБ
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Количество
                          </label>
                          <input
                            type="number"
                            value={disk.count}
                            onChange={(e) => updateHardDisk(index, 'count', parseInt(e.target.value) || 0)}
                            className="input-field"
                            placeholder="1"
                            min="1"
                            max="100"
                            step="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Стоимость за 1 шт. (₽)
                          </label>
                          <input
                            type="number"
                            value={disk.price}
                            onChange={(e) => updateHardDisk(index, 'price', parseFloat(e.target.value) || 0)}
                            className="input-field"
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Модель (опционально)
                          </label>
                          <input
                            type="text"
                            value={disk.model || ''}
                            onChange={(e) => updateHardDisk(index, 'model', e.target.value)}
                            className="input-field"
                            placeholder="WD Red 4TB"
                          />
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          Итого: {disk.count} шт. × {disk.price.toLocaleString()} ₽ = {(disk.count * disk.price).toLocaleString()} ₽
                        </div>
                        <div className="text-gray-500 dark:text-gray-500">
                          Общий объем: {(disk.size * disk.count).toLocaleString()} ТБ
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addHardDisk}
                    className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Добавить еще один тип диска</span>
                    </div>
                  </button>
                </div>

                {/* Общая сводка */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h6 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Общая сводка по дискам:
                  </h6>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <div>
                      Всего дисков: {hardDisks.reduce((sum, disk) => sum + disk.count, 0)} шт.
                    </div>
                    <div>
                      Общий объем: {hardDisks.reduce((sum, disk) => sum + (disk.size * disk.count), 0).toLocaleString()} ТБ
                    </div>
                    <div>
                      Общая стоимость дисков: {hardDisks.reduce((sum, disk) => sum + (disk.count * disk.price), 0).toLocaleString()} ₽
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {device ? 'Обновить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerEquipmentModal; 