import React from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface AudiomPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "error" | "success";
  onConfirm?: () => void;
}

export function AudiomPopup({
  isOpen,
  onClose,
  title,
  message,
  type = "error",
  onConfirm,
}: AudiomPopupProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed -inset-6 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div
          className={`p-4 flex items-center justify-between ${
            type === "error" ? "bg-red-50 border-b border-red-100" : "bg-green-50 border-b border-green-100"
          }`}
        >
          <div className="flex items-center space-x-2">
            {type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <h3
              className={`font-semibold ${
                type === "error" ? "text-red-700" : "text-green-700"
              }`}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed text-center font-medium">
            {message}
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 flex justify-end">
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 rounded-lg font-bold text-white transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === "error"
                ? "bg-red-500 hover:bg-red-600 focus:ring-red-500 shadow-md shadow-red-500/20"
                : "bg-green-500 hover:bg-green-600 focus:ring-green-500 shadow-md shadow-green-500/20"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
