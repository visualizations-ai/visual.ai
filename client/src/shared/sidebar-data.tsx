import { 
  ShoppingCart,
  TrendingUp,
  MessageSquare, 
  Settings 
} from "lucide-react";
import type { IconProps } from "./types/icon-types";

export const sidebarIcons: IconProps[] = [
  { 
    label: "queries", 
    icon: <MessageSquare size={24} />,
    path: "/queries"
  },
  { 
    label: "purchase-recommendations", 
    icon: <ShoppingCart size={24} />,
    path: "/purchase-recommendations"
  },
  { 
    label: "forecasts", 
    icon: <TrendingUp size={24} />,
    path: "/forecasts"
  },
 
  { 
    label: "settings", 
    icon: <Settings size={24} />,
    path: "/settings"
  }
];