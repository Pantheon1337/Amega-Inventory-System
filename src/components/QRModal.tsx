import React, { useState } from 'react';
import { X, Copy, ExternalLink, Download } from 'lucide-react';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';
import { SERVER_URL } from '../config';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: number;
    name: string;
    type: 'device' | 'network' | 'storage';
    user?: string;
    department?: string;
    location?: string;
    office?: string;
  };
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, data }) => {
  const [qrSize, setQrSize] = useState(256);

  if (!isOpen) return null;

  // Создаем URL для веб-доступа
  const apiUrl = SERVER_URL;
  const qrUrl = `${apiUrl}/qr-view/${data.type}/${data.id}`;
  
  // Данные для QR-кода (JSON формат для мобильных приложений)
  const qrData = JSON.stringify({
    type: 'inventory',
    id: data.id,
    category: data.type,
    name: data.name,
    url: qrUrl,
    timestamp: new Date().toISOString()
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast.success('Ссылка скопирована в буфер обмена');
    } catch (error) {
      console.error('Ошибка при копировании:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = qrUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Ссылка скопирована в буфер обмена');
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr_${data.type}_${data.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const openInNewTab = () => {
    window.open(qrUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR-код устройства
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Информация об устройстве */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {data.name}
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div>ID: {data.id}</div>
            <div>Тип: {data.type === 'device' ? 'Устройство' : data.type === 'network' ? 'Сетевое устройство' : 'Складская позиция'}</div>
            {data.user && <div>Пользователь: {data.user}</div>}
            {data.department && <div>Отдел: {data.department}</div>}
            {data.location && <div>Местоположение: {data.location}</div>}
            {data.office && <div>Офис: {data.office}</div>}
          </div>
        </div>

        {/* QR-код */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-white rounded-lg border">
            <QRCode
              value={qrData}
              size={qrSize}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Размер QR-кода */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Размер QR-кода
          </label>
          <input
            type="range"
            min="128"
            max="512"
            step="32"
            value={qrSize}
            onChange={(e) => setQrSize(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            {qrSize}px
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyToClipboard}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Копировать ссылку</span>
          </button>
          
          <button
            onClick={openInNewTab}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Открыть</span>
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={downloadQR}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Скачать QR-код</span>
          </button>
        </div>

        {/* Информация */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 QR-код содержит ссылку на веб-страницу с подробной информацией об устройстве. 
            Отсканируйте его мобильным устройством для быстрого доступа.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRModal; 