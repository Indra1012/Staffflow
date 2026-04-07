import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [company, setCompany] = useState(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'company') return null;
    const saved = localStorage.getItem('company');
    return saved ? JSON.parse(saved) : null;
  });

  const [staffUser, setStaffUser] = useState(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'staff') return null;
    const saved = localStorage.getItem('staffUser');
    return saved ? JSON.parse(saved) : null;
  });

  const loginSave = (token, data, role = 'company') => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    if (role === 'staff') {
      localStorage.setItem('staffUser', JSON.stringify(data));
      localStorage.removeItem('company');
      setStaffUser(data);
      setCompany(null);
    } else {
      localStorage.setItem('company', JSON.stringify(data));
      localStorage.removeItem('staffUser');
      setCompany(data);
      setStaffUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('company');
    localStorage.removeItem('staffUser');
    localStorage.removeItem('userRole');
    setCompany(null);
    setStaffUser(null);
  };

  return (
    <AuthContext.Provider value={{ company, staffUser, loginSave, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
