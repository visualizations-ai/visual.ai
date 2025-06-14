import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconList } from "./icon-side-bar";
import { sidebarIcons } from "./sidebar-data";
import { Menu, X, Plus } from "lucide-react";
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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleIconClick = (icon: IconProps) => {
    navigate(icon.path);
  };

  const handleNewChat = () => {
    navigate('/home', { state: { clearChat: true } });
  };

  const isMobile = forceOpen !== undefined;
  const isActuallyOpen = iconOnly ? false : isMobile ? forceOpen! : isOpen;

  const isOnHomePage = location.pathname === '/home';

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

      <div className={`${isActuallyOpen ? "px-4" : "px-2"} mt-4 flex-1`}>
        <h2
          className={`
            text-xl font-semibold mb-6 bg-clip-text text-transparent 
            bg-gradient-to-r from-indigo-200 to-indigo-400 transition-opacity
            ${isActuallyOpen ? "opacity-100" : "opacity-0 h-0"}
          `}
        >
          Visual.AI
        </h2>

        {isOnHomePage ? (
          <>
            {isActuallyOpen && (
              <div className="mb-6">
                <button
                  onClick={handleNewChat}
                  className="w-full group relative overflow-hidden px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 flex items-center gap-3 text-sm font-medium transform hover:scale-105 active:scale-95"
                  title="Start new conversation"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus 
                    size={16} 
                    className="relative z-10 group-hover:scale-110 transition-transform duration-300" 
                  />
                  <span className="relative z-10 tracking-wide">New Chat</span>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-all duration-300"></div>
                </button>
              </div>
            )}
            {!isActuallyOpen && (
              <div className="mb-6 flex justify-center">
                <button
                  onClick={handleNewChat}
                  className="group relative overflow-hidden p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transform hover:scale-105 active:scale-95"
                  title="Start new conversation"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus 
                    size={20} 
                    className="relative z-10 group-hover:scale-110 transition-transform duration-300" 
                  />
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-all duration-300"></div>
                </button>
              </div>
            )}
            <IconList
              icons={sidebarIcons.filter(icon => icon.label !== "queries")}
              onIconClick={handleIconClick}
              isExpanded={isActuallyOpen}
            />
          </>
        ) : (
          <IconList
            icons={sidebarIcons}
            onIconClick={handleIconClick}
            isExpanded={isActuallyOpen}
          />
        )}
      </div>
    </aside>
  );
};