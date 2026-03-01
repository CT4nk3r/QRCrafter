'use client';

import { useState } from 'react';
import { ErrorCorrectionLevel, eclToPercentage, percentageToECL } from '../types/qr';

interface Props {
  value: ErrorCorrectionLevel;
  onChange: (value: ErrorCorrectionLevel) => void;
}

export function ErrorCorrectionControl({ value, onChange }: Props) {
  const currentPercentage = eclToPercentage(value);
  const [inputValue, setInputValue] = useState(currentPercentage.toString());

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value, 10);
    const ecl = percentageToECL(percentage);
    onChange(ecl);
    setInputValue(eclToPercentage(ecl).toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let percentage = parseInt(inputValue, 10);
    
    // Clamp between 7 and 30
    if (isNaN(percentage) || percentage < 7) {
      percentage = 7;
    } else if (percentage > 30) {
      percentage = 30;
    }
    
    const ecl = percentageToECL(percentage);
    onChange(ecl);
    setInputValue(eclToPercentage(ecl).toString());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Error Correction Level
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="7"
          max="30"
          step="1"
          value={currentPercentage}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="7"
            max="30"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-16 px-2 py-1 text-center rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <span className="text-gray-600 dark:text-gray-400">%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Higher values allow for more damage recovery but create denser QR codes
      </p>
    </div>
  );
}
