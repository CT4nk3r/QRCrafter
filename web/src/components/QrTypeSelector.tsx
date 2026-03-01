'use client';

import { QrType, QR_TYPE_OPTIONS } from '../types/qr';

interface Props {
  selected: QrType;
  onSelect: (type: QrType) => void;
}

export function QrTypeSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        QR Code Type
      </label>
      <div className="flex flex-wrap gap-2">
        {QR_TYPE_OPTIONS.map((option) => {
          const isActive = selected === option.type;
          return (
            <button
              key={option.type}
              onClick={() => onSelect(option.type)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                flex items-center gap-2
                ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
