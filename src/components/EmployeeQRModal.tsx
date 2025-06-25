import React, { useState } from 'react';
import { X, Download, User } from 'lucide-react';
import QRCode from 'qrcode';

interface EmployeeQRModalProps {
  employeeName: string;
  department: string;
  email?: string;
  phone?: string;
  position?: string;
  onClose: () => void;
}

const EmployeeQRModal: React.FC<EmployeeQRModalProps> = ({ 
  employeeName, 
  department, 
  email,
  phone,
  position,
  onClose 
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [useSimpleFormat, setUseSimpleFormat] = useState(false);

  React.useEffect(() => {
    const generateQR = async () => {
      try {
        console.log('Генерация QR-кода для:', { employeeName, department, email, phone, position });
        
        let qrData: string;
        
        if (useSimpleFormat) {
          // Простой текстовый формат для тестирования
          qrData = `Имя: ${employeeName}\nОтдел: ${department}${position ? `\nДолжность: ${position}` : ''}${phone ? `\nТелефон: ${phone}` : ''}${email ? `\nEmail: ${email}` : ''}`;
          console.log('Используется простой формат:', qrData);
        } else {
          // vCard формат
          const escapeVCardValue = (value: string) => {
            return value
              .replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/,/g, '\\,')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r');
          };

          const vCardLines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${escapeVCardValue(employeeName)};;;;`, // Добавляем поле N для лучшей совместимости
            `FN:${escapeVCardValue(employeeName)}`,
            `ORG:${escapeVCardValue(department)}`,
          ];

          // Добавляем должность если есть
          if (position) {
            vCardLines.push(`TITLE:${escapeVCardValue(position)}`);
          }

          // Добавляем телефон если есть
          if (phone) {
            vCardLines.push(`TEL;TYPE=WORK:${escapeVCardValue(phone)}`);
          }

          // Добавляем email если есть
          if (email) {
            vCardLines.push(`EMAIL;TYPE=WORK:${escapeVCardValue(email)}`);
          }

          // Добавляем заметку
          vCardLines.push(`NOTE:${escapeVCardValue(`Сотрудник компании. Отдел: ${department}`)}`);
          vCardLines.push('END:VCARD');

          qrData = vCardLines.join('\r\n');
          console.log('vCard данные:', qrData);
          console.log('Проверка полей:');
          console.log('- FN (Full Name):', escapeVCardValue(employeeName));
          console.log('- N (Name):', escapeVCardValue(employeeName) + ';;;;');
          console.log('- ORG (Organization):', escapeVCardValue(department));
        }
        
        const url = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Ошибка при генерации QR-кода:', error);
      }
    };

    generateQR();
  }, [employeeName, department, email, phone, position, useSimpleFormat]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `contact_${employeeName.replace(/\s+/g, '_')}_${department.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                QR-код контакта сотрудника
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center">
              {/* Информация о сотруднике */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {employeeName}
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Отдел: {department}</p>
                  {position && <p>Должность: {position}</p>}
                  {email && <p>Email: {email}</p>}
                  {phone && <p>Телефон: {phone}</p>}
                </div>
              </div>

              {/* QR-код */}
              <div className="flex justify-center mb-6">
                {qrCodeUrl ? (
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR-код сотрудника" 
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400">Генерация QR-кода...</div>
                  </div>
                )}
              </div>

              {/* Инструкция */}
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                <p className="mb-2">
                  <strong>Назначение:</strong> Создание контакта в телефоне
                </p>
                <p className="mb-2">
                  <strong>Содержит:</strong> ФИО, отдел, должность, контактные данные
                </p>
                <p className="mb-2">
                  <strong>Использование:</strong> Отсканируйте камерой телефона для добавления контакта
                </p>
                <p className="text-xs text-gray-500">
                  При сканировании откроется диалог создания контакта с предзаполненными данными сотрудника
                </p>
                
                {/* Переключатель формата */}
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSimpleFormat}
                      onChange={(e) => setUseSimpleFormat(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs">
                      Использовать простой текстовый формат (для тестирования)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {useSimpleFormat 
                      ? 'Простой текст - отображается как обычный текст при сканировании'
                      : 'vCard формат - создает контакт в телефоне'
                    }
                  </p>
                </div>
              </div>

              {/* Кнопка скачивания */}
              <button
                onClick={handleDownload}
                disabled={!qrCodeUrl}
                className="btn-primary flex items-center justify-center space-x-2 w-full"
              >
                <Download className="w-4 h-4" />
                <span>Скачать QR-код контакта</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeQRModal; 