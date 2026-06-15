// src/services/tracking.service.js
const busLocationRepository = require("../repositories/busLocation.repository");
const busRepository = require("../repositories/bus.repository");
const scheduleRepository = require("../repositories/schedule.repository");
const routeStopRepository = require("../repositories/routeStop.repository");
const mapsService = require("./maps.service");
const busProgressRepository = require('../repositories/busProgress.repository');
class TrackingService {

    static async updateBusLocation(data) {
        const bus = await busRepository.findById(data.bus_id);
        if (!bus) throw new Error("Bus not found");

        const previousLocation = await busLocationRepository.findLatestByBusId(data.bus_id);
        let distanceTraveled = 0;
        let elapsedTime = 0;

        if (previousLocation) {
            distanceTraveled = this.calculateDistance(
                previousLocation.latitude, previousLocation.longitude,
                data.latitude, data.longitude
            );
            const timeDiff = new Date(data.recorded_at) - new Date(previousLocation.recorded_at);
            elapsedTime = previousLocation.elapsed_time + (timeDiff / 60000);
        }

        let scheduleId = data.schedule_id;
        let nextStop = null;
        let estimatedArrival = null;

        if (!scheduleId) {
            const currentSchedule = await this.findCurrentScheduleForBus(data.bus_id);
            if (currentSchedule) scheduleId = currentSchedule.schedule_id;
        }

        if (scheduleId) {
            const schedule = await scheduleRepository.findById(scheduleId);
            if (schedule && schedule.route) {
                nextStop = await this.findNextStop(schedule.route_id, distanceTraveled);

                if (nextStop) {
                    const remainingDistance = nextStop.distance_from_start - distanceTraveled;

                    // Use Google Maps for accurate ETA if coordinates available
                    if (data.latitude && data.longitude && nextStop.latitude && nextStop.longitude) {
                        const etaResult = await mapsService.getETA(
                            data.latitude, data.longitude,
                            nextStop.latitude, nextStop.longitude
                        );
                        estimatedArrival = etaResult.etaMinutes;
                    } else {
                        estimatedArrival = data.speed > 0
                            ? (remainingDistance / data.speed) * 60
                            : nextStop.estimated_arrival_time - elapsedTime;
                    }

                    //  Check if bus has arrived at stop
                    const distanceToStop = this.calculateDistance(
                        data.latitude, data.longitude,
                        nextStop.latitude, nextStop.longitude
                    );

                    if (distanceToStop < 0.1) { // 100 meters
                        console.log(` Bus ${data.bus_id} has arrived at ${nextStop.stop_name}`);
                        // Trigger arrival notification
                        await this.handleBusArrival(data.bus_id, scheduleId, nextStop.stop_id);
                    }
                }
            }
        }

        const locationData = {
            bus_id: data.bus_id,
            schedule_id: scheduleId,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed || 0,
            heading: data.heading || 0,
            accuracy: data.accuracy || null,
            altitude: data.altitude || null,
            battery_level: data.battery_level || null,
            status: data.speed > 0 ? "active" : "stopped",
            next_stop_id: nextStop?.stop_id || null,
            estimated_arrival_to_next: estimatedArrival,
            distance_traveled: distanceTraveled,
            elapsed_time: elapsedTime,
            recorded_at: data.recorded_at || new Date()
        };

        const location = await busLocationRepository.create(locationData);

        if (bus.status !== "on_route" && data.speed > 0) {
            await busRepository.update(data.bus_id, {status: "on_route"});
        }

        return location;
    }

    static async handleBusArrival(busId, scheduleId, stopId) {
        // Update schedule next stop
        const schedule = await scheduleRepository.findById(scheduleId);
        if (schedule) {
            const stops = await routeStopRepository.findByRouteId(schedule.route_id);
            const currentStopIndex = stops.findIndex(s => s.stop_id === stopId);
            const nextStop = stops[currentStopIndex + 1];

            await scheduleRepository.update(scheduleId, {
                current_stop_id: stopId,
                next_stop_id: nextStop?.stop_id || null
            });
        }

        // Could also emit socket event here for real-time notifications
        console.log(`✅ Bus ${busId} arrival recorded at stop ${stopId}`);
    }

// src/services/tracking.service.js
    static async getBusRouteProgress(busId, scheduleId) {
        return await busLocationRepository.getBusRouteProgress(busId, scheduleId);
    }

    static async getAllActiveBusesLocations() {
        const activeBuses = await busRepository.findAllActive(); // returns buses with status 'available' or 'on_route'
        const result = await Promise.all(
            activeBuses.map(async (bus) => {
                const activeSchedule = await scheduleRepository.findActiveScheduleByBus(bus.bus_id);
                let locationData = null;
                let eta = null;
                if (activeSchedule) {
                    const progress = await busLocationRepository.getRouteProgressFromSchedule(bus.bus_id, activeSchedule.schedule_id);
                    if (progress && progress.current_stop && progress.current_stop.latitude && progress.current_stop.longitude) {
                        locationData = {
                            latitude: progress.current_stop.latitude,
                            longitude: progress.current_stop.longitude,
                            speed: 0,
                            heading: 0
                        };
                        if (progress.next_stop && progress.next_stop.estimated_minutes) {
                            eta = progress.next_stop.estimated_minutes;
                        }
                    }
                }
                return {
                    bus_id: bus.bus_id,
                    registration_number: bus.registration_number,
                    bus_model: bus.bus_model,
                    location: locationData, // may be null if no schedule or no coordinates
                    eta_to_next_stop_minutes: eta,
                    last_update: activeSchedule ? activeSchedule.departure_time : new Date().toISOString()
                };
            })
        );
        return result;
    }    static async getBusETA(busId, stopId) {
        const location = await busLocationRepository.findLatestByBusId(busId);
        if (!location) throw new Error("No location data found");

        const stop = await routeStopRepository.findById(stopId);
        if (!stop) throw new Error("Stop not found");

        const etaResult = await mapsService.getETA(
            location.latitude, location.longitude,
            stop.latitude, stop.longitude
        );

        let status = "on_time";
        if (etaResult.etaMinutes > 30) status = "delayed";
        else if (etaResult.etaMinutes <= 5) status = "arriving_soon";

        return {
            bus_id: parseInt(busId),
            stop_name: stop.stop_name,
            eta_minutes: etaResult.etaMinutes,
            eta_text: etaResult.durationText,
            status: status,
            distance_km: etaResult.distanceKm
        };
    }

// src/services/tracking.service.js

// src/services/tracking.service.js
    static async getBusRouteProgress(busId, scheduleId) {
        return await busLocationRepository.getBusRouteProgress(busId, scheduleId);
    }

    static async getAllActiveBusesLocations() {
        const activeBuses = await busRepository.findAllActive(); // returns buses with status 'available' or 'on_route'
        const result = await Promise.all(
            activeBuses.map(async (bus) => {
                const activeSchedule = await scheduleRepository.findActiveScheduleByBus(bus.bus_id);
                let locationData = null;
                let eta = null;
                if (activeSchedule) {
                    const progress = await busLocationRepository.getRouteProgressFromSchedule(bus.bus_id, activeSchedule.schedule_id);
                    if (progress && progress.current_stop && progress.current_stop.latitude && progress.current_stop.longitude) {
                        locationData = {
                            latitude: progress.current_stop.latitude,
                            longitude: progress.current_stop.longitude,
                            speed: 0,
                            heading: 0
                        };
                        if (progress.next_stop && progress.next_stop.estimated_minutes) {
                            eta = progress.next_stop.estimated_minutes;
                        }
                    }
                }
                return {
                    bus_id: bus.bus_id,
                    registration_number: bus.registration_number,
                    bus_model: bus.bus_model,
                    location: locationData, // may be null if no schedule or no coordinates
                    eta_to_next_stop_minutes: eta,
                    last_update: activeSchedule ? activeSchedule.departure_time : new Date().toISOString()
                };
            })
        );
        return result;
    }
//     static async getBusRouteProgress(busId, scheduleId) {
//         // 1. Verify bus is active
//         const bus = await busRepository.findById(busId);
//         if (!bus || bus.status !== 'available') {
//             throw new Error('Bus is not active');
//         }
//
//         // 2. Get schedule (use provided scheduleId or find current active schedule)
//         let schedule;
//         if (scheduleId) {
//             schedule = await scheduleRepository.findById(scheduleId);
//         } else {
//             schedule = await scheduleRepository.findActiveScheduleByBus(busId);
//         }
//         if (!schedule) {
//             throw new Error('No active schedule found for this bus');
//         }
//
//         // 3. Get current and next stop IDs from progress table (not bus_location)
//         console.log(busId)
//         const progress = await busProgressRepository.getCurrentAndNextStop(busId, schedule.id);
//         if (!progress || !progress.current_stop_id) {
//             throw new Error('Route progress data not available for this bus');
//         }
//
//         // 4. Get all stops for the route
//         const stops = await routeStopRepository.findByRouteId(schedule.route_id);
//         if (!stops.length) {
//             throw new Error('No stops defined for this route');
//         }
//
//         // 5. Find current and next stop objects
//         const currentStop = stops.find(s => s.stop_id === progress.current_stop_id);
//         const nextStop = stops.find(s => s.stop_id === progress.next_stop_id);
//
//         if (!currentStop) {
//             throw new Error(`Current stop ID ${progress.current_stop_id} not found in route`);
//         }
//
//         // 6. Calculate progress percentage based on stop order
//         const totalStops = stops.length;
//         const progressPercentage = ((currentStop.stop_order - 1) / (totalStops - 1)) * 100;
//
//         // 7. Build response (matches original structure but with nulls for location)
//         return {
//             route: {
//                 route_id: schedule.route_id,
//                 total_distance: schedule.total_distance,
//                 estimated_duration: schedule.estimated_duration,
//             },
//             current_position: {
//                 latitude: null,
//                 longitude: null,
//                 distance_traveled: null,
//                 elapsed_time: null,
//                 speed: null,
//                 progress_percentage: progressPercentage,
//             },
//             next_stop: nextStop
//                 ? {
//                     stop_name: nextStop.stop_name,
//                     distance_to_next: nextStop.distance_from_start - currentStop.distance_from_start,
//                     estimated_minutes: nextStop.estimated_arrival_time - currentStop.estimated_arrival_time,
//                 }
//                 : null,
//             all_stops: stops.map(stop => ({
//                 stop_id: stop.stop_id,
//                 stop_name: stop.stop_name,
//                 stop_order: stop.stop_order,
//                 distance_from_start: stop.distance_from_start,
//                 estimated_arrival_time: stop.estimated_arrival_time,
//                 is_passed: stop.stop_order <= currentStop.stop_order,
//             })),
//         };
//
// }

    static async getBusHistory(busId, hours = 24) {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hours);

        const locations = await busLocationRepository.findAll({
            bus_id: busId,
            from_date: cutoffTime
        });

        let totalDistance = 0;
        let maxSpeed = 0;

        for (let i = 1; i < locations.length; i++) {
            const dist = this.calculateDistance(
                locations[i - 1].latitude, locations[i - 1].longitude,
                locations[i].latitude, locations[i].longitude
            );
            totalDistance += dist;
            if (locations[i].speed > maxSpeed) maxSpeed = locations[i].speed;
        }

        const totalTime = locations.length > 1
            ? (new Date(locations[locations.length - 1].recorded_at) - new Date(locations[0].recorded_at)) / 3600000
            : 0;
        const avgSpeed = totalTime > 0 ? totalDistance / totalTime : 0;

        return {
            bus_id: parseInt(busId),
            period_hours: hours,
            summary: {
                total_locations: locations.length,
                total_distance_km: totalDistance.toFixed(2),
                avg_speed_kmh: avgSpeed.toFixed(2),
                max_speed_kmh: maxSpeed.toFixed(2)
            },
            locations: locations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                speed: loc.speed,
                heading: loc.heading,
                recorded_at: loc.recorded_at
            }))
        };
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static async findCurrentScheduleForBus(busId) {
        const todaySchedules = await scheduleRepository.findTodaySchedules();
        return todaySchedules.find(s => s.bus_id === busId &&
            new Date(s.departure_time) <= new Date() &&
            new Date(s.arrival_time) >= new Date());
    }

    static async findNextStop(routeId, distanceTraveled) {
        const stops = await routeStopRepository.findByRouteId(routeId);
        return stops.find(stop => stop.distance_from_start > distanceTraveled);
    }

    // src/services/tracking.service.js
// Add inside the TrackingService class

    /**
     * Driver arrives at a stop – updates schedule current/next stop
     * @param {number} scheduleId
     * @param {number} arrivedStopId
     * @returns {Promise<Object>}
     */
    static async driverArrivedAtStop(scheduleId, arrivedStopId) {
        // 1. Get schedule with route and stops
        const schedule = await scheduleRepository.getScheduleWithRouteStops(scheduleId);
        if (!schedule) throw new Error('Schedule not found');

        const route = schedule.Route;
        if (!route || !route.stops || route.stops.length === 0) {
            throw new Error('Route has no stops defined');
        }

        const stops = route.stops; // already sorted by stop_order

        // 2. Find the index of the arrived stop
        const currentIndex = stops.findIndex(s => s.stop_id === arrivedStopId);
        if (currentIndex === -1) {
            throw new Error('Stop does not belong to this route');
        }

        // 3. Determine next stop (if any)
        const nextStop = stops[currentIndex + 1] || null;
        const nextStopId = nextStop ? nextStop.stop_id : null;

        // 4. Update schedule
        const updatedSchedule = await scheduleRepository.updateCurrentAndNextStop(
            scheduleId,
            arrivedStopId,
            nextStopId
        );

        // 5. Optionally update bus location's next_stop_id and distance_traveled
        if (schedule.bus_id) {
            const latestLocation = await busLocationRepository.findLatestByBusId(schedule.bus_id);
            if (latestLocation && latestLocation.schedule_id === scheduleId) {
                await busLocationRepository.update(latestLocation.location_id, {
                    next_stop_id: nextStopId,
                    distance_traveled: nextStop ? nextStop.distance_from_start : latestLocation.distance_traveled,
                    estimated_arrival_to_next: null // will be recalculated on next GPS update
                });
            }
        }

        return {
            schedule_id: scheduleId,
            current_stop_id: arrivedStopId,
            next_stop_id: nextStopId,
            current_stop_name: stops[currentIndex].stop_name,
            next_stop_name: nextStop ? nextStop.stop_name : null,
            is_final_stop: nextStop === null
        };
    }

    static async getActiveBusesWithScheduleProgress() {
        // 1. Get all active buses
        const activeBuses = await busRepository.findAllActive();
        if (!activeBuses.length) return [];

        const result = [];

        for (const bus of activeBuses) {
            // 2. Find current active schedule for this bus
            const schedule = await scheduleRepository.findActiveScheduleByBus(bus.bus_id);

            if (!schedule) {
                // Bus is active but no ongoing schedule
                result.push({
                    bus: {
                        bus_id: bus.bus_id,
                        registration_number: bus.registration_number,
                        bus_model: bus.bus_model,
                        status: bus.status
                    },
                    schedule: null,
                    message: 'No active schedule found'
                });
                continue;
            }

            // 3. Retrieve current and next stop IDs from schedule
            const currentStopId = schedule.current_stop_id;
            const nextStopId = schedule.next_stop_id;

            let currentStop = null;
            let nextStop = null;

            // 4. Get stop names from route stops
            if (schedule.Route && schedule.Route.stops) {
                const stops = schedule.Route.stops;
                if (currentStopId) {
                    currentStop = stops.find(s => s.stop_id === currentStopId);
                }
                if (nextStopId) {
                    nextStop = stops.find(s => s.stop_id === nextStopId);
                }
            }

            // 5. Build response
            result.push({
                bus: {
                    bus_id: bus.bus_id,
                    registration_number: bus.registration_number,
                    bus_model: bus.bus_model,
                    status: bus.status
                },
                schedule: {
                    schedule_id: schedule.schedule_id,
                    route_id: schedule.route_id,
                    route_name: schedule.Route?.route_name,
                    departure_time: schedule.departure_time,
                    arrival_time: schedule.arrival_time,
                    current_stop_id: currentStopId,
                    current_stop_name: currentStop ? currentStop.stop_name : null,
                    next_stop_id: nextStopId,
                    next_stop_name: nextStop ? nextStop.stop_name : null,
                    is_completed: nextStopId === null && currentStopId !== null
                }
            });
        }

        return result;
    }

    static async getBusCurrentLocation(busId) {
        const bus = await busRepository.findById(busId);
        if (!bus) throw new Error("Bus not found");

        // Find active schedule for this bus (current or upcoming)
        const activeSchedule = await scheduleRepository.findActiveScheduleByBus(busId);
        if (!activeSchedule) {
            throw new Error("No active schedule found for this bus");
        }

        // Get route progress from schedule (without GPS)
        const progress = await busLocationRepository.getRouteProgressFromSchedule(busId, activeSchedule.schedule_id);
        if (!progress) {
            throw new Error("Could not determine route progress from schedule");
        }

        // Use current stop coordinates as bus location (if available)
        let locationData = null;
        if (progress.current_stop && progress.current_stop.latitude && progress.current_stop.longitude) {
            locationData = {
                latitude: progress.current_stop.latitude,
                longitude: progress.current_stop.longitude,
                speed: 0,
                heading: 0,
                status: 'stopped',
                recorded_at: activeSchedule.departure_time,
                is_recent: true
            };
        }

        return {
            bus: {
                id: bus.bus_id,
                registration_number: bus.registration_number,
                bus_model: bus.bus_model,
                status: bus.status
            },
            location: locationData,
            next_stop_eta: progress.next_stop ? { etaMinutes: progress.next_stop.estimated_minutes } : null,
            last_update_seconds_ago: 0,
            // Also return schedule progress details for convenience
            route_progress: progress
        };
    }
}
module.exports = TrackingService;