import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Share2, 
  QrCode as QrCodeIcon,
  Monitor,
  Wifi,
  Package,
  User,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Cpu,
  Database,
  HardDrive
} from 'lucide-react';
import { Device, NetworkDevice, StorageItem } from '../types';
import { api } from '../api';
import QRModal from '../components/QRModal';
import QRCode from 'qrcode.react';

const QRView: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Device | NetworkDevice | StorageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadItem();
  }, [type, id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      let foundItem: Device | NetworkDevice | StorageItem | null = null;

      if (type === 'device') {
        const devices = await api.getAll('devices');
        foundItem = devices.find((d: Device) => String(d.id) === id) || null;
      } else if (type === 'network') {
        const networkDevices = await api.getAll('networkDevices');
        foundItem = networkDevices.find((d: NetworkDevice) => String(d.id) === id) || null;
      } else if (type === 'storage') {
        const storageItems = await api.getAll('storageItems');
        foundItem = storageItems.find((s: StorageItem) => String(s.id) === id) || null;
      }

      if (foundItem) {
        setItem(foundItem);
      } else {
        setError('Устройство не найдено');
      }
    } catch (error) {
      console.error('Ошибка при загрузке устройства:', error);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'device': return <Monitor className="w-6 h-6" />;
      case 'network': return <Wifi className="w-6 h-6" />;
      case 'storage': return <Package className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'device': return 'Устройство';
      case 'network': return 'Сетевое устройство';
      case 'storage': return 'Складская позиция';
      default: return 'Устройство';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_use': return 'В работе';
      case 'storage': return 'На складе';
      case 'personal_use': return 'В личном использовании';
      case 'repair': return 'В ремонте';
      case 'broken': return 'Сломанно';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_use': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'storage': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'personal_use': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'repair': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'broken': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const printPage = () => {
    window.print();
  };

  const sharePage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.name || 'Устройство',
          text: `Информация об устройстве: ${item?.name}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Ошибка при попытке поделиться:', error);
      }
    } else {
      // Fallback для браузеров без поддержки Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Устройство не найдено
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Запрашиваемое устройство не существует или было удалено.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                {getTypeIcon()}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getTypeLabel()}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {item.id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowQR(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <QrCodeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">QR-код</span>
              </button>
              <button
                onClick={sharePage}
                className="btn-secondary flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Поделиться</span>
              </button>
              <button
                onClick={printPage}
                className="btn-secondary flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Печать</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Название и тип */}
            <div className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.name}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    {getTypeIcon()}
                    <span>{getTypeLabel()}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/${type === 'device' ? 'devices' : type === 'network' ? 'network' : 'storage'}`)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Редактировать</span>
                </button>
              </div>
            </div>

            {/* Детальная информация */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Детальная информация
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {'model' in item && item.model && (
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Модель</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.model}</p>
                    </div>
                  </div>
                )}

                {'serial_number' in item && item.serial_number && (
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Серийный номер</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.serial_number}</p>
                    </div>
                  </div>
                )}

                {'inventory_number' in item && item.inventory_number && (
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Инвентарный номер</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.inventory_number}</p>
                    </div>
                  </div>
                )}

                {'category' in item && item.category && (
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Категория</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
                    </div>
                  </div>
                )}

                {'user' in item && item.user && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Пользователь</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.user}</p>
                    </div>
                  </div>
                )}

                {'department' in item && item.department && (
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Отдел</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.department}</p>
                    </div>
                  </div>
                )}

                {'location' in item && item.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Местоположение</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.location}</p>
                    </div>
                  </div>
                )}

                {'office' in item && item.office && (
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Офис</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.office}</p>
                    </div>
                  </div>
                )}

                {'status' in item && item.status && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Статус</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                  </div>
                )}

                {'price' in item && item.price && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Стоимость</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {typeof item.price === 'number' ? item.price.toLocaleString() : String(item.price)} ₽
                      </p>
                      {type === 'device' && 'monitor_price' in item && item.monitor_price && 'monitor2_price' in item && item.monitor2_price && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Общая стоимость: {(item.price + item.monitor_price + item.monitor2_price).toLocaleString()} ₽
                        </p>
                      )}
                      {type === 'device' && 'monitor_price' in item && item.monitor_price && !('monitor2_price' in item && item.monitor2_price) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Общая стоимость: {(item.price + item.monitor_price).toLocaleString()} ₽
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Технические характеристики для ПК */}
            {type === 'device' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Технические характеристики
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {'cpu' in item && item.cpu && (
                    <div className="flex items-center space-x-3">
                      <Cpu className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Процессор</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.cpu}</p>
                      </div>
                    </div>
                  )}

                  {'ram' in item && item.ram && (
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Оперативная память</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.ram}</p>
                      </div>
                    </div>
                  )}

                  {'drives' in item && item.drives && (
                    <div className="flex items-center space-x-3">
                      <HardDrive className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Накопители</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.drives}</p>
                      </div>
                    </div>
                  )}

                  {'gpu' in item && item.gpu && (
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Видеокарта</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.gpu}</p>
                      </div>
                    </div>
                  )}

                  {'os' in item && item.os && (
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Операционная система</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.os}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Мониторы для устройств */}
            {type === 'device' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {('category' in item && item.category === 'Ноутбук') ? 'Внешние мониторы' : 'Мониторы'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {'monitor' in item && item.monitor && (
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {('category' in item && item.category === 'Ноутбук') ? 'Внешний монитор 1' : 'Монитор 1'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.monitor}</p>
                        {'monitor_price' in item && item.monitor_price && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.monitor_price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {'monitor2' in item && item.monitor2 && (
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {('category' in item && item.category === 'Ноутбук') ? 'Внешний монитор 2' : 'Монитор 2'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.monitor2}</p>
                        {'monitor2_price' in item && item.monitor2_price && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.monitor2_price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Информация о встроенном экране для ноутбуков */}
                {'category' in item && item.category === 'Ноутбук' && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💻 Ноутбук имеет встроенный экран
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* QR-код */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                QR-код
              </h3>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <QRCode
                    value={JSON.stringify({
                      type: 'inventory',
                      id: item.id,
                      category: type,
                      name: item.name,
                      url: window.location.href,
                      timestamp: new Date().toISOString()
                    })}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Отсканируйте для быстрого доступа
                </p>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Быстрые действия
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/${type === 'device' ? 'devices' : type === 'network' ? 'network' : 'storage'}`)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Редактировать</span>
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  <span>Показать QR-код</span>
                </button>
                <button
                  onClick={sharePage}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Поделиться</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          data={{
            id: item.id,
            name: item.name,
            type: type as 'device' | 'network' | 'storage',
            user: 'user' in item ? item.user : undefined,
            department: 'department' in item ? item.department : undefined,
            location: 'location' in item ? item.location : undefined,
            office: 'office' in item ? item.office : undefined,
          }}
        />
      )}
    </div>
  );
};

export default QRView; 