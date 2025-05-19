import React, { useEffect } from 'react';

 export interface ToastProps {
  message: string;           
  onClose: () => void;      
};

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
