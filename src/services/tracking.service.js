const busLocationRepository = require("../repositories/busLocation.repository");
const busRepository = require("../repositories/bus.repository");
const scheduleRepository = require("../repositories/schedule.repository");
const routeStopRepository = require("../repositories/routeStop.repository");

class TrackingService {
    static async updateBusLocation(data) {
        // Validate bus exists
        const bus = await busRepository.findById(data.bus_id);
        if (!bus) throw new Error("Bus not found");

        // Calculate distance traveled if previous location exists
        const previousLocation = await busLocationRepository.findLatestByBusId(data.bus_id);
        let distanceTraveled = 0;
        let elapsedTime = 0;

        if (previousLocation) {
            distanceTraveled = this.calculateDistance(
                previousLocation.latitude, previousLocation.longitude,
                data.latitude, data.longitude
            );

            const timeDiff = new Date(data.recorded_at) - new Date(previousLocation.recorded_at);
            elapsedTime = previousLocation.elapsed_time + (timeDiff / 60000); // in minutes
        }

        // Find current schedule if any
        let scheduleId = data.schedule_id;
        let nextStop = null;
        let estimatedArrival = null;

        if (!scheduleId) {
            const currentSchedule = await this.findCurrentScheduleForBus(data.bus_id);
            if (currentSchedule) {
                scheduleId = currentSchedule.schedule_id;
            }
        }

        if (scheduleId) {
            const schedule = await scheduleRepository.findById(scheduleId);
            if (schedule && schedule.route) {
                // Find next stop based on current position
                nextStop = await this.findNextStop(schedule.route_id, distanceTraveled);
                if (nextStop) {
                    const remainingDistance = nextStop.distance_from_start - distanceTraveled;
                    estimatedArrival = data.speed > 0
                        ? (remainingDistance / data.speed) * 60
                        : nextStop.estimated_arrival_time - elapsedTime;
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

        // Update bus status if needed
        if (bus.status !== "on_route" && data.speed > 0) {
            await busRepository.update(data.bus_id, { status: "on_route" });
        }

        return location;
    }

    static async getBusCurrentLocation(busId) {
        const location = await busLocationRepository.findLatestByBusId(busId);
        if (!location) throw new Error("No location data found for this bus");

        const bus = await busRepository.findById(busId);

        // Get route progress
        let progress = null;
        if (location.schedule_id) {
            progress = await busLocationRepository.getBusRouteProgress(busId, location.schedule_id);
        }

        return {
            bus: {
                id: bus.bus_id,
                registration_number: bus.registration_number,
                bus_model: bus.bus_model,
                status: bus.status
            },
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                speed: location.speed,
                heading: location.heading,
                status: location.status,
                recorded_at: location.recorded_at
            },
            trip_progress: progress,
            last_update_seconds_ago: Math.floor((new Date() - new Date(location.recorded_at)) / 1000)
        };
    }

    static async getAllActiveBusesLocations() {
        const locations = await busLocationRepository.getActiveBusesLocations();

        const busesWithLocation = await Promise.all(
            locations.map(async (loc) => {
                const bus = await busRepository.findById(loc.bus_id);

                return {
                    bus_id: bus.bus_id,
                    registration_number: bus.registration_number,
                    bus_model: bus.bus_model,
                    location: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        speed: loc.speed,
                        heading: loc.heading,
                        status: loc.status,
                        recorded_at: loc.recorded_at
                    }
                };
            })
        );

        return busesWithLocation;
    }

    static async getBusRouteProgress(busId, scheduleId) {
        const progress = await busLocationRepository.getBusRouteProgress(busId, scheduleId);
        if (!progress) throw new Error("No route progress data found");

        const schedule = await scheduleRepository.findById(scheduleId);
        const stops = await routeStopRepository.findByRouteId(schedule.route_id);

        return {
            route: {
                route_id: schedule.route_id,
                // route_name: schedule.route.route_name,
                total_distance: progress.total_distance,
                estimated_duration: progress.estimated_duration
            },
            current_position: {
                latitude: progress.latitude,
                longitude: progress.longitude,
                distance_traveled: progress.distance_traveled,
                elapsed_time: progress.elapsed_time,
                speed: progress.speed
            },
            next_stop: {
                stop_name: progress.next_stop_name,
                distance_to_next: progress.remaining_distance,
                estimated_minutes: progress.estimated_minutes_to_next_stop
            },
            all_stops: stops.map(stop => ({
                stop_name: stop.stop_name,
                stop_order: stop.stop_order,
                distance_from_start: stop.distance_from_start,
                estimated_arrival_time: stop.estimated_arrival_time
            }))
        };
    }

    static async getBusHistory(busId, hours = 24) {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hours);

        const locations = await busLocationRepository.findAll({
            bus_id: busId,
            from_date: cutoffTime
        });

        // Calculate route summary
        let totalDistance = 0;
        let maxSpeed = 0;
        let avgSpeed = 0;

        for (let i = 1; i < locations.length; i++) {
            const dist = this.calculateDistance(
                locations[i-1].latitude, locations[i-1].longitude,
                locations[i].latitude, locations[i].longitude
            );
            totalDistance += dist;

            if (locations[i].speed > maxSpeed) maxSpeed = locations[i].speed;
        }

        if (locations.length > 1) {
            const totalTime = (new Date(locations[locations.length-1].recorded_at) - new Date(locations[0].recorded_at)) / 3600000;
            avgSpeed = totalDistance / totalTime;
        }

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

    // Helper: Calculate distance between two coordinates (Haversine formula)
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Helper: Find current schedule for bus
    static async findCurrentScheduleForBus(busId) {
        const schedules = await scheduleRepository.findAll({
            bus_id: busId,
            status: "in_progress"
        });

        if (schedules.length > 0) return schedules[0];

        const todaySchedules = await scheduleRepository.findTodaySchedules();
        return todaySchedules.find(s => s.bus_id === busId &&
            new Date(s.departure_time) <= new Date() &&
            new Date(s.arrival_time) >= new Date());
    }

    // Helper: Find next stop based on distance traveled
    static async findNextStop(routeId, distanceTraveled) {
        const stops = await routeStopRepository.findByRouteId(routeId);
        return stops.find(stop => stop.distance_from_start > distanceTraveled);
    }
}

module.exports = TrackingService;