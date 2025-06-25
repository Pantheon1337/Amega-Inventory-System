import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { role, logout } = useUser();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Главная';
      case '/devices':
        return 'Устройства';
      case '/storage':
        return 'Склад';
      case '/network':
        return 'Сетевые устройства';
      default:
        return 'Страница';
    }
  };

  const breadcrumbs = [
    { name: 'Главная', href: '/' },
    ...(location.pathname !== '/' ? [{ name: getPageTitle(), href: location.pathname }] : []),
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400 mr-4">Amega Inventory System</span>
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <nav className="hidden lg:flex items-center space-x-4 ml-4">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {crumb.name}
                </span>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {role && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Пользователь: {role === 'admin' ? 'Администратор' : 'Обычный пользователь'}
            </div>
          )}
          {role && (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="ml-2 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
            >
              Выйти
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 