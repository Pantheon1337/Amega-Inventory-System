import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import MFU from './pages/MFU';
import ServerEquipment from './pages/ServerEquipment';
import Storage from './pages/Storage';
import Network from './pages/Network';
import Logs from './pages/Logs';
import EmployeeQR from './pages/EmployeeQR';
import Backup from './pages/Backup';
import QRView from './pages/QRView';
import VisualPlan from './pages/VisualPlan';
import Login from './pages/Login';
import { ThemeProvider } from './contexts/ThemeContext';
import { useUser } from './contexts/UserContext';
import { checkAndCreateBackup } from './database/idb';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useUser();
  if (!role) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Проверяем бэкап при загрузке аутентифицированного интерфейса
  useEffect(() => {
    checkAndCreateBackup();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 custom-scrollbar">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/qr-view/:type/:id" element={<QRView />} />
          <Route path="/" element={<PrivateRoute><AuthenticatedLayout><Dashboard /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/devices" element={<PrivateRoute><AuthenticatedLayout><Devices /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/mfu" element={<PrivateRoute><AuthenticatedLayout><MFU /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/server-equipment" element={<PrivateRoute><AuthenticatedLayout><ServerEquipment /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/storage" element={<PrivateRoute><AuthenticatedLayout><Storage /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/network" element={<PrivateRoute><AuthenticatedLayout><Network /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute><AuthenticatedLayout><Logs /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/employee-qr" element={<PrivateRoute><AuthenticatedLayout><EmployeeQR /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/backup" element={<PrivateRoute><AuthenticatedLayout><Backup /></AuthenticatedLayout></PrivateRoute>} />
          <Route path="/visual-plan" element={<PrivateRoute><VisualPlan /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
          }}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App; 