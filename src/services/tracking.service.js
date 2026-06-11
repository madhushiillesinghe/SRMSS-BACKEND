// src/services/tracking.service.js
const busLocationRepository = require("../repositories/busLocation.repository");
const busRepository = require("../repositories/bus.repository");
const scheduleRepository = require("../repositories/schedule.repository");
const routeStopRepository = require("../repositories/routeStop.repository");
const mapsService = require("./maps.service");

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

                    // ✅ Use Google Maps for accurate ETA if coordinates available
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

                    // ✅ Check if bus has arrived at stop
                    const distanceToStop = this.calculateDistance(
                        data.latitude, data.longitude,
                        nextStop.latitude, nextStop.longitude
                    );

                    if (distanceToStop < 0.1) { // 100 meters
                        console.log(`🚌 Bus ${data.bus_id} has arrived at ${nextStop.stop_name}`);
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
            await busRepository.update(data.bus_id, { status: "on_route" });
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

    static async getBusCurrentLocation(busId) {
        const location = await busLocationRepository.findLatestByBusId(busId);
        if (!location) throw new Error("No location data found for this bus");

        const bus = await busRepository.findById(busId);
        let eta = null;

        if (location.next_stop_id) {
            const nextStop = await routeStopRepository.findById(location.next_stop_id);
            if (nextStop && location.latitude && location.longitude) {
                const etaResult = await mapsService.getETA(
                    location.latitude, location.longitude,
                    nextStop.latitude, nextStop.longitude
                );
                eta = etaResult;
            } else if (location.estimated_arrival_to_next) {
                eta = { etaMinutes: location.estimated_arrival_to_next };
            }
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
                recorded_at: location.recorded_at,
                is_recent: location.isRecent()
            },
            next_stop_eta: eta,
            last_update_seconds_ago: Math.floor((new Date() - new Date(location.recorded_at)) / 1000)
        };
    }

    static async getBusETA(busId, stopId) {
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

    static async getAllActiveBusesLocations() {
        const locations = await busLocationRepository.getActiveBusesLocations();

        const busesWithLocation = await Promise.all(
            locations.map(async (loc) => {
                const bus = await busRepository.findById(loc.bus_id);
                let eta = null;

                if (loc.next_stop_id) {
                    const nextStop = await routeStopRepository.findById(loc.next_stop_id);
                    if (nextStop && loc.latitude && loc.longitude) {
                        const etaResult = await mapsService.getETA(
                            loc.latitude, loc.longitude,
                            nextStop.latitude, nextStop.longitude
                        );
                        eta = etaResult.etaMinutes;
                    }
                }

                return {
                    bus_id: bus.bus_id,
                    registration_number: bus.registration_number,
                    bus_model: bus.bus_model,
                    location: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        speed: loc.speed,
                        heading: loc.heading
                    },
                    eta_to_next_stop_minutes: eta,
                    last_update: loc.recorded_at
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
                total_distance: progress.total_distance,
                estimated_duration: progress.estimated_duration
            },
            current_position: {
                latitude: progress.latitude,
                longitude: progress.longitude,
                distance_traveled: progress.distance_traveled,
                elapsed_time: progress.elapsed_time,
                speed: progress.speed,
                progress_percentage: (progress.distance_traveled / progress.total_distance) * 100
            },
            next_stop: progress.next_stop_name ? {
                stop_name: progress.next_stop_name,
                distance_to_next: progress.remaining_distance,
                estimated_minutes: progress.estimated_minutes_to_next_stop
            } : null,
            all_stops: stops.map(stop => ({
                stop_id: stop.stop_id,
                stop_name: stop.stop_name,
                stop_order: stop.stop_order,
                distance_from_start: stop.distance_from_start,
                estimated_arrival_time: stop.estimated_arrival_time,
                is_passed: stop.distance_from_start <= progress.distance_traveled
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

        let totalDistance = 0;
        let maxSpeed = 0;

        for (let i = 1; i < locations.length; i++) {
            const dist = this.calculateDistance(
                locations[i-1].latitude, locations[i-1].longitude,
                locations[i].latitude, locations[i].longitude
            );
            totalDistance += dist;
            if (locations[i].speed > maxSpeed) maxSpeed = locations[i].speed;
        }

        const totalTime = locations.length > 1
            ? (new Date(locations[locations.length-1].recorded_at) - new Date(locations[0].recorded_at)) / 3600000
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
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
}

module.exports = TrackingService;