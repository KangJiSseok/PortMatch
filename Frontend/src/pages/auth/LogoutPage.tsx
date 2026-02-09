import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const LogoutPage = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    clearAuth();
    navigate('/login', { replace: true });
  }, [clearAuth, navigate]);

  return null;
};

export default LogoutPage;
