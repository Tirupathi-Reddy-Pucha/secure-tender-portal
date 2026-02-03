import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import MyBids from './components/MyBids';
import ContractorDashboard from './components/ContractorDashboard';
import OfficerDashboard from './components/OfficerDashboard';
import AuditorDashboard from './components/AuditorDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/contractor" element={<ContractorDashboard />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/auditor" element={<AuditorDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
