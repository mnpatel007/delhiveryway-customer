import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import './OrderTrackingMap.css';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '12px'
};

const libraries = ['places', 'geometry'];

const OrderTrackingMap = ({ order, driverLocation, isExpanded, onToggleExpand }) => {
    const [map, setMap] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [eta, setEta] = useState(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyAmK37yeYijXJ1lk6g3ptF_ex3Mrna5ExM',
        libraries
    });

    const shopLocation = useMemo(() => {
        if (!order?.shopId?.address?.coordinates) return null;
        return {
            lat: parseFloat(order.shopId.address.coordinates.lat),
            lng: parseFloat(order.shopId.address.coordinates.lng)
        };
    }, [order]);

    const customerLocation = useMemo(() => {
        if (!order?.deliveryAddress?.coordinates) return null;
        return {
            lat: parseFloat(order.deliveryAddress.coordinates.lat),
            lng: parseFloat(order.deliveryAddress.coordinates.lng)
        };
    }, [order]);

    const driverPos = useMemo(() => {
        if (!driverLocation) return null;
        return {
            lat: parseFloat(driverLocation.latitude),
            lng: parseFloat(driverLocation.longitude)
        };
    }, [driverLocation]);

    // Calculate Route with Split ETA (Driver -> Shop -> Customer)
    const calculateRoute = useCallback(async () => {
        if (!isLoaded || !shopLocation || !customerLocation || !window.google) return;

        try {
            const directionsService = new window.google.maps.DirectionsService();
            let totalDurationSecs = 0;
            let totalDistanceMeters = 0;
            let route1Result = null;
            let route2Result = null;

            // Route 2: Shop -> Customer (Always exists)
            route2Result = await directionsService.route({
                origin: shopLocation,
                destination: customerLocation,
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            if (route2Result.routes?.[0]?.legs?.[0]) {
                const leg = route2Result.routes[0].legs[0];
                totalDurationSecs += leg.duration.value;
                totalDistanceMeters += leg.distance.value;
            }

            // Route 1: Driver -> Shop (Only if driver is available and not at shop yet)
            // We assume driver needs to go to shop if order status implies it
            // Simple check: if driverLocation is available, calculate path to shop
            if (driverPos) {
                try {
                    route1Result = await directionsService.route({
                        origin: driverPos,
                        destination: shopLocation,
                        travelMode: window.google.maps.TravelMode.DRIVING,
                    });

                    if (route1Result.routes?.[0]?.legs?.[0]) {
                        const leg = route1Result.routes[0].legs[0];
                        totalDurationSecs += leg.duration.value;
                        totalDistanceMeters += leg.distance.value;
                    }
                } catch (e) {
                    console.warn("Could not calculate driver->shop route", e);
                }
            }

            // Set formatted Distance and Duration
            const distanceKm = (totalDistanceMeters / 1000).toFixed(1);
            setDistance(`${distanceKm} km`);

            // Format duration human readable
            const hours = Math.floor(totalDurationSecs / 3600);
            const minutes = Math.floor((totalDurationSecs % 3600) / 60);
            let timeString = '';
            if (hours > 0) timeString += `${hours} hr `;
            timeString += `${minutes} min`;
            setDuration(timeString);

            // Calculate ETA
            // Add a buffer for shopping time? Let's keep it pure travel time for now or add fixed buffer
            // Let's add 15 mins shopping buffer if driver is not yet at shop (can be refined later)
            const bufferSecs = 0;
            const arrivalTime = new Date(Date.now() + (totalDurationSecs + bufferSecs) * 1000);
            setEta(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            // We only show the Shop->Customer line on map to keep it clean, OR show both?
            // User asked for "sync", let's show Shop->Customer mainly, 
            // but tracking driver is important. 
            // Let's just set directionsResponse to the Shop->Customer one for the main line,
            // as plotting multiple polylines with one DirectionsRenderer is tricky (needs array).
            // Actually, showing just Shop->Customer path is standard, 
            // while Driver marker moves freely.
            setDirectionsResponse(route2Result);

        } catch (error) {
            console.error("Error calculating route:", error);
        }
    }, [isLoaded, shopLocation, customerLocation, driverPos]);

    useEffect(() => {
        if (isLoaded) {
            calculateRoute();
        }

        // Refresh route every minute to update ETA based on traffic
        const interval = setInterval(() => {
            if (isLoaded) calculateRoute();
        }, 60000);

        return () => clearInterval(interval);
    }, [isLoaded, calculateRoute]);

    // Fit bounds when map loads or locations change
    useEffect(() => {
        if (map && shopLocation && customerLocation) {
            const bounds = new window.google.maps.LatLngBounds();

            // Always include Shop and Customer
            bounds.extend(shopLocation);
            bounds.extend(customerLocation);

            // Include Driver if valid
            if (driverPos && driverPos.lat && driverPos.lng) {
                // Check if driver coords are reasonable (not 0,0)
                if (Math.abs(driverPos.lat) > 0.0001 && Math.abs(driverPos.lng) > 0.0001) {
                    bounds.extend(driverPos);
                }
            }

            // Add generous padding so markers aren't on usage edge
            map.fitBounds(bounds, {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            });
        }
    }, [map, shopLocation, customerLocation, driverPos]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (loadError) {
        return <div className="map-error">Error loading maps: {loadError.message}</div>;
    }

    if (!isLoaded) {
        return <div className="map-loading">Loading Maps...</div>;
    }

    if (!shopLocation || !customerLocation) {
        return <div className="map-error">Location data missing for this order.</div>;
    }

    // Custom icons could be added here
    // const shopIcon = { url: '/assets/shop-marker.png', scaledSize: new window.google.maps.Size(40, 40) };
    // const homeIcon = { url: '/assets/home-marker.png', scaledSize: new window.google.maps.Size(40, 40) };
    // const driverIcon = { url: '/assets/driver-marker.png', scaledSize: new window.google.maps.Size(40, 40) };

    const mapContent = (
        <div className={`order-tracking-map-container ${isExpanded ? 'expanded' : ''}`} style={isExpanded ? { zIndex: 10000 } : {}}>
            <div className="map-wrapper" onClick={!isExpanded ? onToggleExpand : undefined}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={shopLocation}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        disableDefaultUI: !isExpanded,
                        zoomControl: isExpanded,
                        streetViewControl: false,
                        mapTypeControl: false,
                    }}
                >
                    {/* Directions */}
                    {directionsResponse && (
                        <DirectionsRenderer
                            directions={directionsResponse}
                            options={{
                                suppressMarkers: true, // We will use our own markers
                                polylineOptions: {
                                    strokeColor: "#6f42c1",
                                    strokeWeight: 5,
                                }
                            }}
                        />
                    )}

                    {/* Shop Marker */}
                    <Marker
                        position={shopLocation}
                        label={{ text: "🏪", className: "map-marker-label" }}
                        title={order.shopId.name}
                    />

                    {/* Customer Marker */}
                    <Marker
                        position={customerLocation}
                        label={{ text: "🏠", className: "map-marker-label" }}
                        title="Delivery Location"
                    />

                    {/* Driver Marker */}
                    {driverPos && (
                        <Marker
                            position={driverPos}
                            label={{ text: "🛵", className: "map-marker-label" }}
                            title="Personal Shopper"
                            animation={window.google.maps.Animation.DROP}
                        />
                    )}
                </GoogleMap>

                {/* Overlay Info for Small View / Pop up */}
                <div className="map-info-overlay" onClick={(e) => { e.stopPropagation(); if (!isExpanded) onToggleExpand(); }}>
                    <div className="eta-badge">
                        <span className="eta-label">Total ETA</span>
                        <span className="eta-time">{eta || '--:--'}</span>
                    </div>
                    {duration && <div className="duration-badge">{duration} away</div>}
                    {!isExpanded && <div className="expand-hint">Click to expand map</div>}
                </div>

                {isExpanded && (
                    <button className="close-map-btn" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
                        ✕
                    </button>
                )}
            </div>
        </div>
    );

    if (isExpanded) {
        return ReactDOM.createPortal(mapContent, document.body);
    }

    return mapContent;
};

export default React.memo(OrderTrackingMap);
