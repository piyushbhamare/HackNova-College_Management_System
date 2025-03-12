const express = require('express');
const { createAssignment, getFacultyAssignments, getStudentAssignments, submitAssignment, gradeAssignment } = require('../controllers/assignmentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['faculty']), createAssignment);
router.get('/faculty', authMiddleware, getFacultyAssignments);
router.get('/student', authMiddleware, getStudentAssignments);
router.post('/submit', authMiddleware, submitAssignment);
router.post('/grade', authMiddleware, roleMiddleware(['faculty']), gradeAssignment);

module.exports = router;