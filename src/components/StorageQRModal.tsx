import React from 'react';
import { X } from 'lucide-react';
import QRCode from 'qrcode.react';
import { StorageItem } from '../types';

interface StorageQRModalProps {
  item: StorageItem;
  onClose: () => void;
}

const StorageQRModal: React.FC<StorageQRModalProps> = ({ item, onClose }) => {
  const qrData = JSON.stringify({
    type: 'storage_item',
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                QR-код складской позиции
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {item.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.category}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Количество: {item.quantity}
                </p>
              </div>

              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode
                    value={qrData}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Отсканируйте QR-код для быстрого доступа к информации о складской позиции
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full sm:w-auto"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageQRModal; 