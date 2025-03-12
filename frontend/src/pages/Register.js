import { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, MenuItem, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { register, getClasses } from '../services/api'; // Assume getClasses is a new API call

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]); // Store classes from backend
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await getClasses(); // API call to get classes
        setClasses(res.data);
      } catch (err) {
        console.error('Failed to fetch classes:', err.response?.data || err.message);
        setError('Failed to load classes. Please try again later.');
      }
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { name, email, password, role };
      if (role === 'student') {
        if (!classId) {
          setError('Class ID is required for students');
          return;
        }
        data.classId = classId;
      }
      console.log('Registering with:', data); // Debug input
      const res = await register(data);
      console.log('Response:', res.data); // Debug response
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user)); // Store user data
      navigate(`/${role}`); // Navigate to role-specific route
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Register</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          select
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            if (e.target.value !== 'student') setClassId(''); // Reset classId if not student
          }}
          fullWidth
          margin="normal"
          required
        >
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="faculty">Faculty</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>
        {role === 'student' && (
          <TextField
            select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            fullWidth
            margin="normal"
            required
            helperText={classes.length === 0 ? 'Loading classes...' : 'Select your class'}
          >
            {classes.length === 0 ? (
              <MenuItem value="" disabled>No classes available</MenuItem>
            ) : (
              classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name || cls._id} {/* Display name if available, else _id */}
                </MenuItem>
              ))
            )}
          </TextField>
        )}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Register
        </Button>
      </form>
      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Already have an account? <Link href="/login">Login</Link>
      </Typography>
    </Container>
  );
};

export default Register;