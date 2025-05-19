import React, { useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[]; 
  selected: string; 
  onSelect: (value: string) => void;
}

export const CustomDropdown: React.FC<Props> = ({ options, selected, onSelect }) => {
  
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div >
    
      <button
        onClick={() => setIsOpen(!isOpen)} 
        
      >
        
        {options.find((o) => o.value === selected)?.label || "choose an option"}
      </button>

      {isOpen && (
        <ul>
          {options.map((option) => (
            <li
              key={option.value} 
              onClick={() => {
                onSelect(option.value); 
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
