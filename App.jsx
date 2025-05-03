
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { AuthProvider } from './components/auth/AuthContext';
import { MusicProvider } from './contexts/MusicContext';
import AppRoutes from './AppRoutes';
import MainLayout from './components/layout/MainLayout';
import { Toaster } from './components/ui/toaster';
import ChatbotWrapper from './components/common/ChatbotWrapper';
import { useAuth } from './components/auth/AuthContext';

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <AuthProvider>
          <MusicProvider>
            <MainLayout>
              <AppRoutes />
            </MainLayout>
            <Toaster />
            <ConditionalChatbot />
          </MusicProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

// Separate component for conditional chatbot rendering
const ConditionalChatbot = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ChatbotWrapper /> : null;
};

export default App;
