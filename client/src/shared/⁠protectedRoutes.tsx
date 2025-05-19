import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { setUser } from '../store/authSlice'; // ודא שזה אכן קיים

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roles = [], 
  redirectPath = '/login' 
}) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector(state => state.auth);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      setIsAuthorized(false);
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));

    dispatch(setUser(user));

    if (roles.length === 0) {
      setIsAuthorized(true);
      return;
    }

    const hasRequiredRole = roles.some(role => user.roles?.includes(role));
    setIsAuthorized(hasRequiredRole);
  }, [isAuthenticated, user, loading, roles, dispatch]);
  
  if (loading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700">...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
