'use client';

import { useState } from 'react';
import { PRESET_COLORS } from '../types/qr';

interface Props {
  fgColor: string;
  bgColor: string;
  size: number;
  onFgColorChange: (color: string) => void;
  onBgColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
}

const isValidHex = (val: string) =>
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);

function ColorPresetRow({
  colors,
  selected,
  onSelect,
  keyPrefix,
}: {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
  keyPrefix: string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <button
          key={`${keyPrefix}-${c}`}
          onClick={() => onSelect(c)}
          aria-label={`Select color ${c}`}
          aria-pressed={selected === c}
          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
            selected === c
              ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700 scale-110'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
}

function HexInput({
  color,
  onChange,
  placeholder,
}: {
  color: string;
  onChange: (color: string) => void;
  placeholder: string;
}) {
  const [draftHex, setDraftHex] = useState(color);
  const [isEditing, setIsEditing] = useState(false);
  const visibleHex = isEditing ? draftHex : color;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 shrink-0"
        style={{
          backgroundColor:
            visibleHex && isValidHex(visibleHex) ? visibleHex : color,
        }}
      />
      <input
        type="text"
        value={visibleHex}
        aria-label="Hex color value"
        onFocus={() => {
          setDraftHex(color);
          setIsEditing(true);
        }}
        onChange={e => {
          const val = e.target.value.startsWith('#')
            ? e.target.value
            : `#${e.target.value}`;
          setDraftHex(val);
          if (isValidHex(val)) {
            onChange(val.toUpperCase());
          }
        }}
        onBlur={() => {
          if (isValidHex(draftHex)) {
            onChange(draftHex.toUpperCase());
          }
          setIsEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            if (isValidHex(draftHex)) {
              onChange(draftHex.toUpperCase());
            }
            setIsEditing(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        maxLength={7}
        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );
}

export function QrStyleEditor({
  fgColor,
  bgColor,
  size,
  onFgColorChange,
  onBgColorChange,
  onSizeChange,
}: Props) {
  const [draftSizeText, setDraftSizeText] = useState(String(Math.round(size)));
  const [isEditingSize, setIsEditingSize] = useState(false);
  const visibleSizeText = isEditingSize
    ? draftSizeText
    : String(Math.round(size));

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Customize Style
      </h3>

      {/* Foreground Color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Foreground Color
        </label>
        <ColorPresetRow
          colors={PRESET_COLORS.slice(0, 6)}
          selected={fgColor}
          onSelect={onFgColorChange}
          keyPrefix="fg1"
        />
        <ColorPresetRow
          colors={PRESET_COLORS.slice(6)}
          selected={fgColor}
          onSelect={onFgColorChange}
          keyPrefix="fg2"
        />
        <HexInput
          color={fgColor}
          onChange={onFgColorChange}
          placeholder="#000000"
        />
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Background Color
        </label>
        <ColorPresetRow
          colors={PRESET_COLORS.slice(0, 6)}
          selected={bgColor}
          onSelect={onBgColorChange}
          keyPrefix="bg1"
        />
        <ColorPresetRow
          colors={PRESET_COLORS.slice(6)}
          selected={bgColor}
          onSelect={onBgColorChange}
          keyPrefix="bg2"
        />
        <HexInput
          color={bgColor}
          onChange={onBgColorChange}
          placeholder="#FFFFFF"
        />
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label
          htmlFor="qr-size-slider"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Size
        </label>
        <div className="flex items-center gap-3">
          <input
            id="qr-size-slider"
            type="range"
            min="120"
            max="400"
            step="1"
            value={size}
            onChange={e => onSizeChange(parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={visibleSizeText}
              onFocus={() => {
                setDraftSizeText(String(Math.round(size)));
                setIsEditingSize(true);
              }}
              onChange={e => setDraftSizeText(e.target.value)}
              onBlur={() => {
                const num = parseInt(draftSizeText, 10);
                if (!isNaN(num) && num >= 120 && num <= 400) {
                  onSizeChange(num);
                }
                setIsEditingSize(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const num = parseInt(draftSizeText, 10);
                  if (!isNaN(num) && num >= 120 && num <= 400) {
                    onSizeChange(num);
                  }
                  setIsEditingSize(false);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              maxLength={3}
              className="w-14 px-2 py-1 text-center rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
