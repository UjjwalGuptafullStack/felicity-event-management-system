const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/publicStatsController');

router.get('/public/stats', getPublicStats);

module.exports = router;
