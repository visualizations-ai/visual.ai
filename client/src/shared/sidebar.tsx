import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconList } from "./icon-side-bar";
import { sidebarIcons } from "./sidebar-data";
import { Menu, X } from "lucide-react";
import type { IconProps } from "./types/icon-types";

interface SidebarProps {
  iconOnly?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  iconOnly = false,
  forceOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleIconClick = (icon: IconProps) => {
    navigate(icon.path);
  };

  const isMobile = forceOpen !== undefined;
  const isActuallyOpen = iconOnly ? false : isMobile ? forceOpen! : isOpen;

  return (
    <aside
className={`      
        h-screen 
        bg-gradient-to-b from-slate-900 to-slate-800
        transition-all duration-300 
        ${isActuallyOpen ? "w-64" : "w-20"} 
        flex flex-col
        z-50
      `}
    >
      {isMobile && onClose && (
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-300 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={28} />
          </button>
        </div>
      )}

      {!iconOnly && !isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`mt-4 ${isActuallyOpen ? "ml-4" : "mx-auto"} p-2 
            text-indigo-300 hover:bg-slate-700/50 rounded-lg transition-colors`}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      )}

      <div className={`${isActuallyOpen ? "px-4" : "px-2"} mt-4`}>
        <h2
          className={`
            text-xl font-semibold mb-6 bg-clip-text text-transparent 
            bg-gradient-to-r from-indigo-200 to-indigo-400 transition-opacity
            ${isActuallyOpen ? "opacity-100" : "opacity-0 h-0"}
          `}
        >
          Visual.AI
        </h2>
        
        <IconList
          icons={sidebarIcons}
          onIconClick={handleIconClick}
          isExpanded={isActuallyOpen}
        />
      </div>
    </aside>
  );
};