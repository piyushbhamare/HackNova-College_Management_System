const express = require('express');
const { createNotice, getNotices } = require('../controllers/noticeController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin']), createNotice);
router.get('/', authMiddleware, getNotices);

module.exports = router;