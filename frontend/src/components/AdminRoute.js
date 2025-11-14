import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  // 1. Get the admin email from the .env file
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;

  // 2. Wait for auth to finish loading
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="spinner" />
      </div>
    );
  }

  // 3. Check if user is logged in AND is the admin
  const isAdmin = user && user.email === adminEmail;

  // 4. If they are the admin, show the admin page.
  //    Otherwise, redirect them to the home page.
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;