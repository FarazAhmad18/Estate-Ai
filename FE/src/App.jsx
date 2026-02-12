import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Dashboard from './pages/Dashboard';
import CreateProperty from './pages/CreateProperty';
import EditProperty from './pages/EditProperty';
import BuyerProfile from './pages/BuyerProfile';
import SavedProperties from './pages/SavedProperties';
import AdminDashboard from './pages/AdminDashboard';
import AgentProfile from './pages/AgentProfile';

const AUTH_ROUTES = ['/login', '/register'];

function AppContent() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

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
          </Routes>
        </main>
        {!isAuthPage && <Footer />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
