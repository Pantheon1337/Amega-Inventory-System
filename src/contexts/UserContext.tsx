import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'user' | null;

interface UserContextType {
  role: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  role: null,
  login: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || null;
  });

  const login = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole) localStorage.setItem('userRole', newRole);
    else localStorage.removeItem('userRole');
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <UserContext.Provider value={{ role, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}; 