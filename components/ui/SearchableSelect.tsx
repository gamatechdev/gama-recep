
import React, { useState, useEffect, useRef } from 'react';

interface OptionItem {
  id: string | number;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  onSelect: (val: string) => void;
  options: OptionItem[];
  placeholder?: string;
  required?: boolean;
  onAddNew?: (val: string) => void;
  addNewLabel?: string;
  noResultText?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onSelect,
  options,
  placeholder,
  required,
  onAddNew,
  addNewLabel,
  noResultText,
  className = ''
}) => {
  const [showList, setShowList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    (opt.label || '')?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 tracking-wide">
          {label}
        </label>
      )}

      <div
        onClick={() => { setShowList(!showList); if (!showList) setSearchTerm(''); }}
        className={`
          w-full h-12 px-4 rounded-xl flex items-center justify-between cursor-pointer border-2 transition-all duration-200
          ${showList
            ? 'bg-white border-ios-primary ring-4 ring-ios-primary/10 shadow-sm'
            : 'bg-gray-50 border-transparent hover:bg-gray-100'
          }
        `}
      >
        <span className={`text-sm truncate ${value ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
          {value || placeholder || 'Selecione...'}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showList ? 'rotate-180 text-ios-primary' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {showList && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input inside the dropdown */}
          <div className="p-3 bg-gray-50/50 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-ios-primary/20 focus:border-ios-primary transition-all"
                onClick={(e) => e.stopPropagation()}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar max-h-60 p-1">
            {/* Top Button: Show if there's a search term and no exact match */}
            {searchTerm && !options.some(opt => opt.label?.toLowerCase() === searchTerm?.toLowerCase()) && (
              <button
                type="button"
                onClick={() => { 
                  setShowList(false); 
                  if (onAddNew) {
                    onAddNew(searchTerm);
                  } else {
                    onSelect(searchTerm);
                  }
                }}
                className="w-full text-left px-4 py-3 bg-ios-primary/5 hover:bg-ios-primary/10 transition-colors text-sm text-ios-primary font-bold flex items-center gap-2 rounded-lg mb-1 border border-dashed border-ios-primary/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {addNewLabel || (onAddNew ? `Cadastrar "${searchTerm}"` : `Usar "${searchTerm}"`)}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onSelect(opt.label); setShowList(false); }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg transition-all duration-150 text-sm font-medium
                    ${value === opt.label
                      ? 'bg-ios-primary/10 text-ios-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))
            ) : !searchTerm ? (
              onAddNew ? (
                <button
                  type="button"
                  onClick={() => { setShowList(false); onAddNew(""); }}
                  className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-sm text-ios-primary font-bold flex items-center gap-2 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {addNewLabel || "+ Cadastrar nova"}
                </button>
              ) : (
                <div className="px-4 py-6 text-center text-gray-400 text-xs italic">
                  {noResultText || 'Nenhum resultado encontrado'}
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
