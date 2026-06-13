// test-maps.js
const MapsService = require('./src/services/maps.service');
require('dotenv').config();

async function test() {
    try {
        const result = await MapsService.calculateDistance("Hikkaduwa, Sri Lanka", "Colombo, Sri Lanka");
        console.log("✅ Distance calculation succeeded:", result);
    } catch (error) {
        console.error("❌ Distance calculation failed:", error.message);
        if (error.response?.data) console.error("API response:", error.response.data);
    }
}

test();