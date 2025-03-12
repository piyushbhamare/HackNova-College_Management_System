const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Auth middleware, token:', token); // Debug token
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded); 
    req.user = decoded; 
    next();
  } catch (err) {
    console.error('Token verification error:', err.message); // Debug error
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const roleMiddleware = (roles) => (req, res, next) => {
  console.log('Role middleware, user role:', req.user?.role, 'allowed roles:', roles); // Debug role check
  if (!req.user || !roles.includes(req.user.role)) {
    console.log('Access denied for role:', req.user?.role);
    return res.status(403).json({ msg: 'Access denied' });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };