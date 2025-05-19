import React, { useEffect } from 'react';

import type { ToastProps } from "./types/toast-type";

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);

    return () => clearTimeout(timer);
  }, [onClose]); 

  return (
    <div
    >
      {message} 
    </div>
  );
};
