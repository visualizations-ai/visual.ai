import { 
  ShoppingCart,
  TrendingUp,
  MessageSquare, 
  Database,
  Code,
  BarChart3
} from "lucide-react";
import type { IconProps } from "./types/icon-types";

export const sidebarIcons: IconProps[] = [
  { 
    label: "queries", 
    icon: <MessageSquare size={24} />,
    path: "/home"
  },
  { 
    label: "data", 
    icon: <Database size={24} />,
    path: "/data-sources"
  },
  { 
    label: "sql-editor", 
    icon: <Code size={24} />,
    path: "/sql-editor"
  },
  { 
    label: "charts", 
    icon: <BarChart3 size={24} />,
    path: "/charts"
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
  }
];