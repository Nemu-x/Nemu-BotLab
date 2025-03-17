import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Chats from './pages/Chats';
import BotCommands from './pages/BotCommands';
import Settings from './pages/Settings';
import Operators from './pages/Operators';

function App() {
  // TODO: Implement auth check
  const isAuthenticated = false;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="chats" element={<Chats />} />
          <Route path="bot-commands" element={<BotCommands />} />
          <Route path="settings" element={<Settings />} />
          <Route path="operators" element={<Operators />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App; 