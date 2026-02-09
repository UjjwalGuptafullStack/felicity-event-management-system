import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, allowedActorType, allowedRole }) => {
  const { isAuthenticated, actorType, role, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check actor type
  if (allowedActorType && actorType !== allowedActorType) {
    return <Navigate to="/" replace />;
  }

  // Check role (for users)
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
