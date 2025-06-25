import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  QrCode, 
  User, 
  Download,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import EmployeeQRModal from '../components/EmployeeQRModal';
import toast from 'react-hot-toast';
import { DEPARTMENTS, Employee } from '../types';
import { api } from '../api';
import { subscribeToDBUpdates, unsubscribeFromDBUpdates } from '../socket';

const EmployeeQR: React.FC = () => {
  const { role } = useUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const loadEmployees = useCallback(async () => {
    const data = await api.getAll('employees');
    setEmployees(data);
    const depts = [...new Set(data.map((emp: Employee) => emp.department))] as string[];
    setDepartments(depts);
  }, []);

  const filterEmployees = useCallback(() => {
    let filtered = employees;
    if (searchTerm) {
      filtered = filtered.filter((emp: Employee) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((emp: Employee) => emp.department === departmentFilter);
    }
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  // Подписка на WebSocket для employees
  useEffect(() => {
    const handleDBUpdate = (data: any) => {
      if (data.table === 'employees' || data.table === 'history') {
        loadEmployees();
      }
    };
    subscribeToDBUpdates(handleDBUpdate);
    return () => unsubscribeFromDBUpdates(handleDBUpdate);
  }, [loadEmployees]);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      await api.remove('employees', id);
        toast.success('Сотрудник удален');
    }
  };

  const handleShowQR = (employee: Employee) => {
    console.log('Открытие QR-кода для сотрудника:', employee);
    console.log('Проверка данных:');
    console.log('- name:', employee.name);
    console.log('- department:', employee.department);
    console.log('- position:', employee.position);
    console.log('- email:', employee.email);
    console.log('- phone:', employee.phone);
    setSelectedEmployee(employee);
    setIsQRModalOpen(true);
  };

  const handleSaveEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingEmployee) {
      // Редактирование
      const updatedEmployee: Employee = {
        ...editingEmployee,
        ...employeeData,
        updated_at: new Date().toISOString()
      };
      await api.update('employees', editingEmployee.id, updatedEmployee);
        toast.success('Сотрудник обновлен');
    } else {
      // Добавление
      const newEmployee: Employee = {
        ...employeeData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await api.create('employees', newEmployee);
        toast.success('Сотрудник добавлен');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Контакты сотрудников
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Управление сотрудниками и генерация QR-кодов для создания контактов в телефоне
          </p>
        </div>
        {role === 'admin' && (
          <button
            onClick={handleAddEmployee}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить сотрудника</span>
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени, отделу или должности..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
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
            <User className="w-4 h-4 mr-2" />
            Найдено: {filteredEmployees.length}
          </div>
        </div>
      </div>

      {/* Список сотрудников */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="card p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {employee.department}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleShowQR(employee)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="QR-код"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {employee.position && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Должность:</span> {employee.position}
                </div>
              )}
              {employee.email && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Email:</span> {employee.email}
                </div>
              )}
              {employee.phone && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Телефон:</span> {employee.phone}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Пустое состояние */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Сотрудники не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {employees.length === 0 
              ? 'Добавьте первого сотрудника для генерации QR-кодов.'
              : 'Попробуйте изменить параметры поиска.'
            }
          </p>
        </div>
      )}

      {/* Модальное окно добавления/редактирования сотрудника */}
      {isModalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEmployee}
        />
      )}

      {/* Модальное окно QR-кода */}
      {isQRModalOpen && selectedEmployee && (
        <EmployeeQRModal
          employeeName={selectedEmployee.name}
          department={selectedEmployee.department}
          email={selectedEmployee.email}
          phone={selectedEmployee.phone}
          position={selectedEmployee.position}
          onClose={() => setIsQRModalOpen(false)}
        />
      )}
    </div>
  );
};

// Компонент модального окна для добавления/редактирования сотрудника
interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    email: '',
    phone: ''
  });

  const [customDepartment, setCustomDepartment] = useState('');
  const [existingDepartments, setExistingDepartments] = useState<string[]>([]);

  // Загружаем существующие отделы
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const employees = await api.getAll('employees');
        const depts = [...new Set(employees.map((emp: Employee) => emp.department))] as string[];
        // Объединяем с базовыми отделами
        const allDepartments = [...DEPARTMENTS, ...depts];
        const unique = [...new Set(allDepartments)] as string[];
        setExistingDepartments(unique);
      } catch (error) {
        console.error('Ошибка при загрузке отделов:', error);
        setExistingDepartments(DEPARTMENTS);
      }
    };
    loadDepartments();
  }, []);

  React.useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        department: employee.department,
        position: employee.position || '',
        email: employee.email || '',
        phone: employee.phone || ''
      });
      setCustomDepartment(employee.department === 'Другое' ? '' : '');
    } else {
      setFormData({
        name: '',
        department: '',
        position: '',
        email: '',
        phone: ''
      });
      setCustomDepartment('');
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.department) {
      toast.error('Заполните обязательные поля');
      return;
    }
    if (formData.department === 'Другое' && !customDepartment.trim()) {
      toast.error('Введите название отдела');
      return;
    }
    const dataToSave = {
      ...formData,
      department: formData.department === 'Другое' ? customDepartment : formData.department,
    };
    onSave(dataToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {employee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
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
                  ФИО *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Отдел *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Выберите отдел</option>
                  {existingDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="Другое">Другое</option>
                </select>
                {formData.department === 'Другое' && (
                  <input
                    type="text"
                    name="customDepartment"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className="input-field mt-2"
                    placeholder="Введите название отдела"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Должность
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Системный администратор"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="ivanov@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+7 (999) 123-45-67"
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
              {employee ? 'Сохранить' : 'Добавить'}
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

export default EmployeeQR; 