import React, { useState } from "react";
import { Menu, LogOut, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux-hooks";
import { logoutUser } from "../store/auth-slice";
import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  onTitleClick?: () => void;
  titleClickable?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  onTitleClick,
  titleClickable = false
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  const handleTitleClick = () => {
    if (titleClickable && onTitleClick) {
      onTitleClick();
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
            className="fixed inset-0 bg-transparent z-40 lg:hidden"
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
              
              <div 
                onClick={handleTitleClick}
                className={`flex items-center gap-3 flex-1 min-w-0 ${
                  titleClickable ? 'cursor-pointer hover:bg-slate-100/70 rounded-lg p-2 transition-colors' : ''
                }`}
                title={titleClickable ? "Start new conversation" : undefined}
              >
                
              <div className="min-w-0 flex-1">
                  <h1 className="animate__animated animate__slideInRight text-lg font-semibold text-slate-800 truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="animate__animated animate__slideInRight animate__delay-1 text-sm text-slate-600 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
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
          <div 
            onClick={handleTitleClick}
            className={`flex items-center gap-4 ${
              titleClickable ? 'cursor-pointer hover:bg-indigo-50/30 rounded-xl p-3 transition-colors group' : ''
            }`}
            title={titleClickable ? "Start new conversation" : undefined}
          >
            
           <div>
  <h1
    className={`animate__animated animate__fadeInDown text-3xl font-bold text-slate-800 ${
      titleClickable ? 'title-hover cursor-pointer' : ''
    }`}
  >
    {title}
  </h1>

  {subtitle && (
    <p className="animate__animated animate__fadeInDown animate__delay-1 text-slate-600 mt-1">
      {subtitle}
    </p>
  )}

</div>

          </div>
          
          <div className="flex items-center gap-3">
            {headerActions && (
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="p-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {user?.email?.split('@')[0] || 'User'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user?.email || 'user@example.com'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};