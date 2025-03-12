const express = require('express');
const { markAttendance, getStudentAttendance, getClassStudents } = require('../controllers/attendanceController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['faculty']), markAttendance);
router.get('/student', authMiddleware, getStudentAttendance);
router.get('/students', authMiddleware, getClassStudents);

module.exports = router;