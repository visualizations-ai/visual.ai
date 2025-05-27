import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux-hooks';
import { checkCurrentUser } from '../store/auth-slice'; 

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
 
    if (!isAuthenticated && !loading) {
      dispatch(checkCurrentUser());
      return;
    }
    
  
    if (loading) return;

    if (!isAuthenticated || !user) {
      setIsAuthorized(false);
      return;
    }

  

    if (roles.length === 0) {
      setIsAuthorized(true);
      return;
    }

    const hasRequiredRole = roles.includes(user.role);
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