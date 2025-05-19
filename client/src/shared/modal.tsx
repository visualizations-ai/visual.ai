import React from "react";
import type { ModalProps } from "./types/modal-type"; 

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">Modal Title</h2>
      <button onClick={onClose} aria-label="Close modal">Close</button>
      <div>{children}</div>
    </div>
  );
}    

