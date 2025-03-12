import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect, useState } from 'react';
import { getUser } from './services/api';

const PrivateRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getUser();
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        console.error('Error fetching user:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/student"
          element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>}
        />
        <Route
          path="/faculty"
          element={<PrivateRoute allowedRoles={['faculty']}><FacultyDashboard /></PrivateRoute>}
        />
        <Route
          path="/admin"
          element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>}
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;