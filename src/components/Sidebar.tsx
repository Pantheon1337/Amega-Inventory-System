import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Monitor, 
  Package, 
  Wifi, 
  X,
  BarChart3,
  Clock,
  User,
  Archive,
  Map
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { role } = useUser();

  const navigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Устройства', href: '/devices', icon: Monitor },
    { name: 'МФУ', href: '/mfu', icon: Package },
    { name: 'Серверное оборудование', href: '/server-equipment', icon: Archive },
    { name: 'Склад', href: '/storage', icon: Package },
    { name: 'Сеть', href: '/network', icon: Wifi },
    ...(role === 'admin' ? [{ name: 'Логи', href: '/logs', icon: Clock }] : []),
    ...(role === 'admin' ? [{ name: 'Бэкапы', href: '/backup', icon: Archive }] : []),
    { name: 'Контакты сотрудников', href: '/employee-qr', icon: User },
    { name: 'Визуальный план', href: '/visual-plan', icon: Map },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
              Amega Inventory System
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 transition-colors duration-200
                    ${isActive(item.href)
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    }
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Тема
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {isDark ? (
                <div className="w-4 h-4 bg-yellow-400 rounded-full" />
              ) : (
                <div className="w-4 h-4 bg-gray-600 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 