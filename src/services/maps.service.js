const axios = require("axios");

class MapsService {
    async getCoordinates(location) {
        const response = await axios.get(
            "https://api.openrouteservice.org/geocode/search",
            {
                params: {
                    api_key: process.env.ORS_API_KEY,
                    text: location,
                    size: 1
                }
            }
        );

        const feature = response.data.features?.[0];
        if (!feature) {
            throw new Error(`Location not found: ${location}`);
        }

        return {
            lng: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1]
        };
    }

    async calculateDistance(startLocation, endLocation) {
        const start = await this.getCoordinates(startLocation);
        const end = await this.getCoordinates(endLocation);

        const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
                coordinates: [
                    [start.lng, start.lat],
                    [end.lng, end.lat]
                ]
            },
            {
                headers: {
                    Authorization: process.env.ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const route = response.data.routes[0];
        return {
            distanceKm: Number((route.summary.distance / 1000).toFixed(2)),
            durationMin: Math.ceil(route.summary.duration / 60)
        };
    }

}

module.exports = new MapsService();