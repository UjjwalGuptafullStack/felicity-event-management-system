import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: null,
    actorType: null,
    role: null,
    user: null,
    isAuthenticated: false,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const token = localStorage.getItem('token');
    const actorData = localStorage.getItem('actor');
    
    if (token && actorData) {
      try {
        const actor = JSON.parse(actorData);
        setAuth({
          token,
          actorType: actor.actorType,
          role: actor.role,
          user: actor.user,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Failed to parse actor data:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = (token, actorData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('actor', JSON.stringify(actorData));
    
    setAuth({
      token,
      actorType: actorData.actorType,
      role: actorData.role,
      user: actorData.user,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('actor');
    
    setAuth({
      token: null,
      actorType: null,
      role: null,
      user: null,
      isAuthenticated: false,
    });
  };

  const value = {
    ...auth,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
