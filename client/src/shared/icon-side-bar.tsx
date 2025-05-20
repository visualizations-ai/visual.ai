import React, { useState } from "react";
import type { IconProps } from "./types/icon-types";


interface IconListProps {
  icons: IconProps[];
  onIconClick: (icon: IconProps) => void;
}

export const IconList: React.FC<IconListProps> = ({ icons, onIconClick }) => {
  const [selectedIcon, setSelectedIcon] = useState<IconProps | null>(null);

  const handleIconClick = (icon: IconProps) => {
    setSelectedIcon(icon);    
    onIconClick(icon);        
  };

  return (
    <div>
      
      {icons.length === 0 ? (
        <p>No items to display</p>
      ) : (
       
        icons.map((icon) => (
          <div
            key={icon.label}                            
            onClick={() => handleIconClick(icon)}       
            className={selectedIcon?.label === icon.label ? 'selected' : ''}  
            style={{ cursor: "pointer", padding: "8px", margin: "4px 0" }}   
          >
            {icon.icon}                                
            <span style={{ marginLeft: 8 }}>{icon.label}</span>  
          </div>
        ))
      )}
    </div>
  );
};
