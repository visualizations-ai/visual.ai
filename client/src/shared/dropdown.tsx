import React, { useState } from "react";
import type { CustomDropdownProps, Option } from "./types/dropdown-types";

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        aria-haspopup="listbox"             
        aria-expanded={isOpen}              
        onClick={() => setIsOpen(!isOpen)}
      >
        {options.find((o: Option) => o.value === selected)?.label || "choose an option"}
      </button>

      {isOpen && (
        <ul role="listbox">
          {options.map((option: Option) => (
            <li
              key={option.value}
              role="option"
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
