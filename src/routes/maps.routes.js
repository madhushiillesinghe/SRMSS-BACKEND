const express = require('express');
const router = express.Router();
const { geocode } = require('../controllers/maps.controller');

router.get('/geocode', geocode);

module.exports = router;