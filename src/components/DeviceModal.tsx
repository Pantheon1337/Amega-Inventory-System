import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Device, DEPARTMENTS } from '../types';
import { api } from '../api';

interface Employee {
  id: number;
  name: string;
  department: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface DeviceModalProps {
  device: Device | null;
  onClose: () => void;
  onSave: (device: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => void;
}

const DeviceModal: React.FC<DeviceModalProps> = ({ device, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    inventory_number: '',
    model: '',
    serial_number: '',
    user: '',
    department: '',
    status: 'storage' as 'in_use' | 'storage' | 'personal_use' | 'repair' | 'broken',
    category: 'Ноутбук' as 'ПК' | 'Ноутбук',
    office: '',
    cpu: '',
    ram: '',
    drives: '',
    gpu: '',
    monitor: '',
    monitor2: '',
    monitor_price: 0,
    monitor2_price: 0,
    price: 0,
    os: '',
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [existingDepartments, setExistingDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await api.getAll('employees');
      setEmployees(data);
      } catch (error) {
        setEmployees([]);
      }
    }
    loadEmployees();
  }, []);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        inventory_number: device.inventory_number || '',
        model: device.model,
        serial_number: device.serial_number,
        user: device.user,
        department: device.department,
        status: device.status,
        category: device.category,
        office: device.office || '',
        cpu: device.cpu || '',
        ram: device.ram || '',
        drives: device.drives || '',
        gpu: device.gpu || '',
        monitor: device.monitor || '',
        monitor2: device.monitor2 || '',
        monitor_price: device.monitor_price || 0,
        monitor2_price: device.monitor2_price || 0,
        price: device.price || 0,
        os: device.os || '',
      });
    }
  }, [device]);

  useEffect(() => {
    // Загружаем существующие отделы из localStorage и объединяем с DEPARTMENTS без дубликатов (регистр, пробелы)
    const stored = localStorage.getItem('employees');
    let depts: string[] = [...DEPARTMENTS];
    if (stored) {
      const employees = JSON.parse(stored);
      const fromEmployees = employees.map((emp: Employee) => emp.department);
      // Уникализируем по нижнему регистру и trim
      const all = [...DEPARTMENTS, ...fromEmployees];
      const unique: string[] = [];
      const seen = new Set<string>();
      all.forEach(orig => {
        const norm = orig.trim().toLowerCase();
        if (!seen.has(norm)) {
          seen.add(norm);
          unique.push(orig.trim());
        }
      });
      depts = unique;
    }
    setExistingDepartments(depts);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Генерируем имя автоматически из инвентарного номера
    const deviceName = formData.inventory_number;
    
    onSave({
      ...formData,
      name: deviceName,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'user' && value) {
      const selectedEmployee = employees.find(emp => emp.name === value);
      if (selectedEmployee) {
        setFormData(prev => ({
          ...prev,
          user: value,
          department: selectedEmployee.department
        }));
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'monitor_price', 'monitor2_price'].includes(name) ? (value ? parseFloat(value) || 0 : 0) : value
    }));
  };

  const departments = existingDepartments.length > 0 ? existingDepartments : DEPARTMENTS;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {device ? 'Редактировать устройство' : 'Добавить устройство'}
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
                  Категория *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Ноутбук">Ноутбук</option>
                  <option value="ПК">ПК</option>
                </select>
              </div>

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
                  placeholder="SWS-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Модель
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Dell OptiPlex 7090"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Серийный номер
                </label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="SN123456789"
                />
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

              {/* Технические характеристики */}
              {(formData.category === 'ПК' || formData.category === 'Ноутбук') && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Технические характеристики
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Процессор *
                    </label>
                    <input
                      type="text"
                      name="cpu"
                      value={formData.cpu}
                      onChange={handleChange}
                      required={formData.category === 'ПК' || formData.category === 'Ноутбук'}
                      className="input-field"
                      placeholder="Intel Core i5-10400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Оперативная память *
                    </label>
                    <input
                      type="text"
                      name="ram"
                      value={formData.ram}
                      onChange={handleChange}
                      required={formData.category === 'ПК' || formData.category === 'Ноутбук'}
                      className="input-field"
                      placeholder="16 ГБ DDR4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Накопители (тип и объем) *
                    </label>
                    <input
                      type="text"
                      name="drives"
                      value={formData.drives}
                      onChange={handleChange}
                      required={formData.category === 'ПК' || formData.category === 'Ноутбук'}
                      className="input-field"
                      placeholder="SSD 512 ГБ, HDD 1 ТБ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Видеокарта
                    </label>
                    <input
                      type="text"
                      name="gpu"
                      value={formData.gpu}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="NVIDIA GTX 1650"
                    />
                  </div>
                  </div>
                </div>
              )}

              {/* Пользователь и статус */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Пользователь и статус
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Пользователь
                </label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Выберите сотрудника</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

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
                </div>
              </div>

              {/* Мониторы */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {formData.category === 'Ноутбук' ? 'Внешние мониторы' : 'Мониторы'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {formData.category === 'Ноутбук' ? 'Внешний монитор 1' : 'Монитор 1'}
                </label>
                <input
                  type="text"
                  name="monitor"
                  value={formData.monitor}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Dell P2419H"
                />
              </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Цена {formData.category === 'Ноутбук' ? 'внешнего монитора 1' : 'монитора 1'}
                    </label>
                    <input
                      type="number"
                      name="monitor_price"
                      value={formData.monitor_price}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Введите цену"
                      min="0"
                      step="0.01"
                    />
                  </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {formData.category === 'Ноутбук' ? 'Внешний монитор 2' : 'Монитор 2'}
                </label>
                <input
                  type="text"
                  name="monitor2"
                  value={formData.monitor2}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Dell P2419H"
                />
              </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Цена {formData.category === 'Ноутбук' ? 'внешнего монитора 2' : 'монитора 2'}
                    </label>
                    <input
                      type="number"
                      name="monitor2_price"
                      value={formData.monitor2_price}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Введите цену"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {/* Информация о встроенном экране для ноутбуков */}
                {formData.category === 'Ноутбук' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💻 Ноутбук имеет встроенный экран. Здесь можно указать дополнительные внешние мониторы.
                    </p>
                  </div>
                )}
              </div>

              {/* Дополнительное ПО */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Дополнительное ПО
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ОС
                    </label>
                    <input
                      type="text"
                      name="os"
                      value={formData.os}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Windows 10 Pro, Ubuntu 22.04 и т.д."
                    />
                  </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Офис (Microsoft Office)
                </label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Версия, ключ, и т.д."
                />
              </div>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-primary w-full sm:w-auto sm:ml-3"
            >
              {device ? 'Сохранить' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal; 