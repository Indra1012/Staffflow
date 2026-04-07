import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StaffPortal from './pages/StaffPortal';
import EmployeePortal from './pages/EmployeePortal';

const ProtectedRoute = ({ children }) => {
  const { company, staffUser } = useAuth();
  if (staffUser) return <Navigate to="/employee" replace />;
  return company ? children : <Navigate to="/login" replace />;
};

const StaffRoute = ({ children }) => {
  const { staffUser } = useAuth();
  return staffUser ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/staff-portal/*" element={
        <StaffRoute>
          <StaffPortal />
        </StaffRoute>
      } />
      <Route path="/employee/*" element={
        <StaffRoute>
          <EmployeePortal />
        </StaffRoute>
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
