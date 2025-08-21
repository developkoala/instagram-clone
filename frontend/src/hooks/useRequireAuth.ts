import { useNavigate } from 'react-router-dom';
import { useAuth } from "./useAuth";

export const useRequireAuth = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    callback();
  };

  return requireAuth;
};