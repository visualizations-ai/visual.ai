import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); 
    return () => clearTimeout(timer);
  }, [onClose]); 

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};