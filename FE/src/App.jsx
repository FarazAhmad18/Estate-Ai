import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Dashboard from './pages/Dashboard';
import CreateProperty from './pages/CreateProperty';
import EditProperty from './pages/EditProperty';
import BuyerProfile from './pages/BuyerProfile';
import SavedProperties from './pages/SavedProperties';
import AdminDashboard from './pages/AdminDashboard';
import AgentProfile from './pages/AgentProfile';
import Messages from './pages/Messages';
import ChatBubble from './components/ChatBubble';

const AUTH_ROUTES = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

function AppContent() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const isAdminPage = pathname === '/admin';
  const isMessagesPage = pathname === '/messages';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1d1d1f',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 20px',
          },
        }}
      />
      <div className="flex flex-col min-h-screen">
        {!isAuthPage && <Navbar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/verify-otp" element={<VerifyOtp />} /> */}
            {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
            {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/agents/:id" element={<AgentProfile />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="Agent">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/create"
              element={
                <ProtectedRoute role="Agent">
                  <CreateProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties/:id/edit"
              element={
                <ProtectedRoute role="Agent">
                  <EditProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedProperties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <BuyerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        {!isAuthPage && !isAdminPage && !isMessagesPage && <Footer />}
        {!isAuthPage && !isAdminPage && <ChatBubble />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MessageProvider>
          <AppContent />
        </MessageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
