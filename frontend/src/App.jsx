import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/router';
import { AuthProvider } from './app/auth';
import './styles/variables.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
