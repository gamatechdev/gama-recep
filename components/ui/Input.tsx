
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3.5 
          bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 
          text-slate-900 dark:text-white placeholder-slate-400
          rounded-[18px] 
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 focus:border-[#04a7bd] focus:bg-white dark:focus:bg-black
          disabled:bg-slate-100 dark:disabled:bg-white/10 disabled:text-slate-400
          ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 ml-1 text-xs text-red-500 animate-fadeIn">{error}</p>}
    </div>
  );
};
