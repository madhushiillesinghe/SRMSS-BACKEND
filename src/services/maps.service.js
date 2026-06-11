// src/services/maps.service.js
const { Client } = require("@googlemaps/google-maps-services-js");

const client = new Client({});

class MapsService {

    static async calculateDistance(origin, destination) {
        try {
            const response = await client.distancematrix({
                params: {
                    origins: [origin],
                    destinations: [destination],
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    mode: "driving",
                    units: "metric"
                }
            });

            const row = response.data.rows[0];
            const element = row.elements[0];

            if (element.status !== "OK") {
                throw new Error("Could not calculate distance");
            }

            return {
                distanceKm: element.distance.value / 1000,
                distanceText: element.distance.text,
                durationMin: Math.ceil(element.duration.value / 60),
                durationText: element.duration.text
            };
        } catch (error) {
            console.error("Distance calculation error:", error.message);
            throw error;
        }
    }

    static async getDirections(originLat, originLng, destLat, destLng) {
        try {
            const response = await client.directions({
                params: {
                    origin: `${originLat},${originLng}`,
                    destination: `${destLat},${destLng}`,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    mode: "driving"
                }
            });

            const route = response.data.routes[0];
            const leg = route.legs[0];

            return {
                distanceKm: leg.distance.value / 1000,
                distanceText: leg.distance.text,
                durationMin: Math.ceil(leg.duration.value / 60),
                durationText: leg.duration.text,
                polyline: route.overview_polyline.points,
                steps: leg.steps.map(step => ({
                    instruction: step.html_instructions,
                    distance: step.distance.text,
                    duration: step.duration.text,
                    startLocation: step.start_location,
                    endLocation: step.end_location
                }))
            };
        } catch (error) {
            console.error("Directions error:", error.message);
            throw error;
        }
    }

    static async getETA(originLat, originLng, destLat, destLng) {
        try {
            const response = await client.distancematrix({
                params: {
                    origins: [`${originLat},${originLng}`],
                    destinations: [`${destLat},${destLng}`],
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    mode: "driving"
                }
            });

            const element = response.data.rows[0].elements[0];

            if (element.status !== "OK") {
                return { etaMinutes: null, error: "Cannot calculate ETA" };
            }

            return {
                etaMinutes: Math.ceil(element.duration.value / 60),
                distanceKm: element.distance.value / 1000,
                durationText: element.duration.text
            };
        } catch (error) {
            console.error("ETA error:", error.message);
            return { etaMinutes: null, error: error.message };
        }
    }
}

module.exports = MapsService;