const express = require('express');
const { createTimetable, getStudentTimetable, getFacultyTimetable, addHoliday, getHolidays, addEvent, getEvents } = require('../controllers/timetableController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin']), createTimetable);
router.get('/student', authMiddleware, getStudentTimetable);
router.get('/faculty', authMiddleware, getFacultyTimetable);
router.post('/holiday', authMiddleware, roleMiddleware(['admin']), addHoliday);
router.get('/holidays', authMiddleware, getHolidays);
router.post('/event', authMiddleware, roleMiddleware(['admin']), addEvent);
router.get('/events', authMiddleware, getEvents);

module.exports = router;