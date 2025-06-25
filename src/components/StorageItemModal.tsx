import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StorageItem } from '../types';

interface StorageItemModalProps {
  item: StorageItem | null;
  onClose: () => void;
  onSave: (item: Omit<StorageItem, 'id' | 'created_at' | 'updated_at'>) => void;
}

const StorageItemModal: React.FC<StorageItemModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<StorageItem, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    inventory_number: '',
    category: '',
    quantity: 0,
    price: 0,
    responsible_person: '',
    image_url: ''
  });

  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        inventory_number: item.inventory_number,
        category: item.category,
        quantity: item.quantity,
        price: item.price || 0,
        responsible_person: item.responsible_person,
        image_url: item.image_url || ''
      });
      setCustomCategory(item.category === 'Другое' ? '' : '');
    } else {
      setFormData({
        name: '',
        inventory_number: '',
        category: '',
        quantity: 0,
        price: 0,
        responsible_person: '',
        image_url: ''
      });
      setCustomCategory('');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Генерируем название автоматически
    const category = formData.category === 'Другое' ? customCategory : formData.category;
    const generatedName = `${category} ${formData.inventory_number}`;
    
    const dataToSave = {
      ...formData,
      name: generatedName,
      category: category,
    };
    onSave(dataToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const categories = [
    'Компьютеры',
    'Ноутбуки',
    'Мониторы',
    'Принтеры',
    'Сетевое оборудование',
    'Кабели',
    'Аксессуары',
    'Другое',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {item ? 'Редактировать позицию' : 'Добавить позицию'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <option value="">Выберите категорию</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {formData.category === 'Другое' && (
                  <input
                    type="text"
                    name="customCategory"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="input-field mt-2"
                    placeholder="Введите категорию"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Количество *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="input-field"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Цена (₽)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ответственный
                </label>
                <input
                  type="text"
                  name="responsible_person"
                  value={formData.responsible_person}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Иванов И.И."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL изображения
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-primary w-full sm:w-auto sm:ml-3"
            >
              {item ? 'Сохранить' : 'Добавить'}
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

export default StorageItemModal; 