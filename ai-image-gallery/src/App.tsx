import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { NotificationContainer } from './components/NotificationContainer';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <ToastContainer />
              <NotificationContainer />
            </div>
          </Router>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
