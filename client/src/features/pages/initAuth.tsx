import { useEffect } from "react";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { setUser } from "../../store/auth-slice";

const InitAuth = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {

    const userJson = localStorage.getItem("user");
    
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        dispatch(setUser(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        dispatch(setUser(null));
      }
    } else {
      dispatch(setUser(null));
    }
  }, [dispatch]);

  return <>{children}</>;
};

export default InitAuth;