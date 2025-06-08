import React, { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux-hooks";
import { logoutUser } from "../store/auth-slice";
import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  icon,
  headerActions
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {isMobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-transparent z-40 lg:hidde"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 z-50 lg:hidden">
            <Sidebar forceOpen={true} onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-gradient-to-b from-indigo-50/90 to-slate-50/90 border-b border-slate-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} className="text-slate-700" />
              </button>
              
              {icon}
              
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-slate-800 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-slate-600 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-3">
              {headerActions}
              
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between p-6 bg-gradient-to-b from-indigo-50/90 to-slate-50/90 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
              {subtitle && (
                <p className="text-slate-600">{subtitle}</p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-3">
              {headerActions}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};