import React, { useState } from "react";

export interface IconProps {
  icon: React.ReactNode;
  label: string;
}

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
    <div >
      {icons.map((icon) => (
        <div
          key={icon.label}
          onClick={() => handleIconClick(icon)}
          className={selectedIcon?.label === icon.label ? 'selected' : ''}
        >
          {icon.icon}
          <span>{icon.label}</span>
        </div>
      ))}
    </div>
  );
};
