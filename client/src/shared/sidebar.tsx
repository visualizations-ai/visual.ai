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
    h-screen 
    bg-gradient-to-b from-slate-900 to-slate-800
    transition-all duration-300 
    ${isOpen ? "w-64" : "w-20"} 
    flex flex-col
  `}
		>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`
        mt-4 
        ${isOpen ? "ml-4" : "mx-auto"}
        p-2 
        text-indigo-300 
        hover:bg-slate-700/50 
        rounded-lg 
        transition-colors
      `}
				aria-label="Toggle menu"
			>
				<Menu size={24} />
			</button>

			<div className={`${isOpen ? "px-4" : "px-2"} mt-4`}>
				<h2
					className={`
        text-xl font-semibold mb-6 bg-clip-text text-transparent 
        bg-gradient-to-r from-indigo-200 to-indigo-400 transition-opacity
        ${isOpen ? "opacity-100" : "opacity-0 h-0"}
      `}
				>
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
