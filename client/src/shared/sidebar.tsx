import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconList } from "./icon-side-bar";
import { sidebarIcons } from "./sidebar-data";
import { Menu } from "lucide-react";
import type { IconProps } from "./types/icon-types";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
 
  const handleIconClick = (icon: IconProps) => {
    navigate(icon.path);
  };

  return (
    <aside 
      className={`
        h-screen bg-white border-l border-gray-200 transition-all duration-300
        ${isOpen ? 'w-64' : 'w-16'}
      `}
    >
     
      <div className="p-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

    
      <div className={`${isOpen ? 'px-4' : 'px-2'}`}>
        <h2 className={`
          text-xl font-semibold mb-6 text-gray-700 transition-opacity
          ${isOpen ? 'opacity-100' : 'opacity-0 h-0'}
        `}>
          Visual.AI
        </h2>
        <IconList 
          icons={sidebarIcons} 
          onIconClick={handleIconClick}
          isExpanded={isOpen}
        />
      </div>
    </aside>
  );
};