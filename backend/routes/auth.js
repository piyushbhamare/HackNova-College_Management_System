const express = require('express');
const { login, register, getUser, getFaculties, assignClass } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getUser);
router.get('/faculties', authMiddleware, getFaculties); 
router.post('/assign-class', authMiddleware, assignClass);

module.exports = router;