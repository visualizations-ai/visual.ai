import React from "react";
import { IconList } from "./icon-side-bar";
import type { IconProps } from "./types/icon-types";

const icons: IconProps[] = [
];



export const Sidebar: React.FC = () => {
 
  const handleIconClick = (icon: IconProps) => {
    console.log("icon:", icon.label);
  };

  return (
    <aside className="sidebar" style={{ width: 200, borderRight: "1px solid #ccc", padding: 16 }}>
    
      <IconList icons={icons} onIconClick={handleIconClick} />
    </aside>
  );
};
