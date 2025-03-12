const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
      console.log('Role middleware, user role:', req.user.role, 'allowed roles:', allowedRoles);
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Unauthorized' });
      }
      next();
    };
  };
  
  // Usage example in a route:
  router.post('/add-holiday', authMiddleware, roleMiddleware(['admin']), timetableController.addHoliday);
  
  module.exports = roleMiddleware;