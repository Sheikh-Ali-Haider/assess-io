import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

/**
 * App Component - Root of the application
 * 
 * Architecture:
 * 1. BrowserRouter - Enables routing throughout the app
 * 2. AuthProvider - Provides authentication context to all components
 * 3. AppRoutes - Central routing logic
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
