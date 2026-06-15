// src/controllers/maps.controller.js
const mapsService = require('../services/maps.service');

const geocode = async (req, res) => {
    try {
        const { location } = req.query;
        if (!location) {
            return res.status(400).json({ success: false, message: 'Location is required' });
        }
        const coords = await mapsService.getCoordinates(location);
        if (!coords) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }
        res.json({
            success: true,
            data: {
                latitude: coords.lat,
                longitude: coords.lng
            }
        });
    } catch (error) {
        console.error('Geocode error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { geocode };