import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MFUDevice } from '../types';

interface MFUModalProps {
  device: MFUDevice | null;
  onClose: () => void;
  onSave: (device: Omit<MFUDevice, 'id' | 'created_at' | 'updated_at'>) => void;
}

const MFUModal: React.FC<MFUModalProps> = ({ device, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<MFUDevice, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    inventory_number: '',
    model: '',
    serial_number: '',
    user: '',
    department: '',
    status: 'storage' as 'in_use' | 'storage' | 'broken' | 'personal_use' | 'repair',
    category: 'МФУ',
    price: 0
  });

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
        price: device.price || 0
      });
    } else {
      setFormData({
        name: '',
        inventory_number: '',
        model: '',
        serial_number: '',
        user: '',
        department: '',
        status: 'storage',
        category: 'МФУ',
        price: 0
      });
    }
  }, [device]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      name: formData.category
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value ? parseFloat(value) || 0 : 0) : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {device ? 'Редактировать МФУ' : 'Добавить МФУ'}
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
                      Модель *
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="HP LaserJet Pro M404n"
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
                      <option value="МФУ">МФУ</option>
                      <option value="Принтер">Принтер</option>
                      <option value="Плоттер">Плоттер</option>
                      <option value="Сканер">Сканер</option>
                      <option value="3D-принтер">3D-принтер</option>
                    </select>
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

export default MFUModal; 