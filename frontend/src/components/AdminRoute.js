// src/components/AdminRoute.js
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  // Use the values from our new AuthContext
  const { isAdmin, loading, currentUser } = useAuth();

  // 1. Wait for auth to finish loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading auth state...</p>
      </div>
    );
  }

  // 2. Check if user is logged in
  if (!currentUser) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // 3. If they are logged in but NOT admin, redirect to home.
  //    If they ARE admin, show the nested admin page (<Outlet />).
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;