import React, { useState } from "react";
import type { IconProps } from "./types/icon-types";

interface IconListProps {
  icons: IconProps[];
  onIconClick: (icon: IconProps) => void;
  isExpanded?: boolean;
}

export const IconList: React.FC<IconListProps> = ({ 
  icons, 
  onIconClick,
  isExpanded = true 
}) => {
  const [selectedIcon, setSelectedIcon] = useState<IconProps | null>(null);

  const handleIconClick = (icon: IconProps) => {
    setSelectedIcon(icon);    
    onIconClick(icon);        
  };

  return (
    <div className="space-y-1">
      {icons.length === 0 ? (
        <p className="text-gray-500 text-center">no items to display</p>
      ) : (
        icons.map((icon) => (
          <div
            key={icon.label}                            
            onClick={() => handleIconClick(icon)}       
            className={`
              flex items-center p-2 rounded-lg cursor-pointer transition-all
              ${selectedIcon?.label === icon.label 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-gray-100 text-gray-700'}
              ${isExpanded ? 'px-4' : 'justify-center'}
            `}
            title={!isExpanded ? icon.label : undefined}
          >
            <span className="flex-shrink-0">{icon.icon}</span>
            {isExpanded && (
              <span className="text-sm font-medium truncate mr-4">{icon.label}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
};
