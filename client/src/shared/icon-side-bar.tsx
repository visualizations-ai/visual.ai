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
	isExpanded = true,
}) => {
	const [selectedIcon, setSelectedIcon] = useState<IconProps | null>(null);

	const handleIconClick = (icon: IconProps) => {
		setSelectedIcon(icon);
		onIconClick(icon);
	};

	return (
		<div className="space-y-1">
			{icons.length === 0 ? (
				<p className="text-indigo-100/50 text-center">no items to display</p>
			) : (
				icons.map((icon) => (
					<div
						key={icon.label}
						onClick={() => handleIconClick(icon)}
						className={`
              flex items-center py-3 px-2 rounded-lg cursor-pointer
              ${
								selectedIcon?.label === icon.label
									? "bg-indigo-900/50 text-indigo-50"
									: "text-indigo-100 hover:bg-slate-700/50"
							}
              ${isExpanded ? "px-4 gap-4" : "justify-center"}
            `}
						title={!isExpanded ? icon.label : undefined}
					>
						<span className="flex-shrink-0">{icon.icon}</span>
						{isExpanded && (
							<span className="text-sm font-medium truncate">{icon.label}</span>
						)}
					</div>
				))
			)}
		</div>
	);
};