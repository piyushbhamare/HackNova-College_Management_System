const express = require('express');
const router = express.Router();
const { getClasses } = require('../controllers/classController');

router.get('/', getClasses);

module.exports = router;