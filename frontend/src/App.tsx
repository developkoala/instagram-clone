import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Toasts from './components/common/Toast';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Feed from './pages/home/Feed';
import Profile from './pages/profile/Profile';
import Explore from './pages/explore/Explore';
import Messages from './pages/messages/Messages';
import Notifications from './pages/notifications/Notifications';
import Settings from './pages/settings/Settings';
import SuggestedUsers from './pages/explore/SuggestedUsers';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import PWAInstall from './components/common/PWAInstall';
import './utils/pwa'; // PWA 초기화

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <WebSocketProvider>
              <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/" element={<Layout />}>
                  <Route index element={<Feed />} />
                  <Route path="profile/:username" element={<Profile />} />
                  <Route path="explore" element={<Explore />} />
                  <Route 
                    path="explore/people/suggested" 
                    element={
                      <PrivateRoute>
                        <SuggestedUsers />
                      </PrivateRoute>
                    } 
                  />
                  <Route
                    path="messages"
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="notifications"
                    element={
                      <PrivateRoute>
                        <Notifications />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <PrivateRoute>
                        <Settings />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="accounts/edit"
                    element={
                      <PrivateRoute>
                        <Settings />
                      </PrivateRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/posts" element={<AdminPosts />} />
              </Routes>
            </Router>
            <Toasts />
            <PWAInstall />
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;