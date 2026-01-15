import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
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

    // Calculate Route
    const calculateRoute = useCallback(async () => {
        if (!isLoaded || !shopLocation || !customerLocation || !window.google) return;

        // Origin is driver if available, otherwise shop
        const origin = driverPos || shopLocation;
        const destination = customerLocation;

        try {
            const directionsService = new window.google.maps.DirectionsService();
            const results = await directionsService.route({
                origin: origin,
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            setDirectionsResponse(results);

            if (results.routes?.[0]?.legs?.[0]) {
                const leg = results.routes[0].legs[0];
                setDistance(leg.distance.text);
                setDuration(leg.duration.text);

                // Calculate ETA
                const durationSecs = leg.duration.value;
                const arrivalTime = new Date(Date.now() + durationSecs * 1000);
                setEta(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
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
            bounds.extend(shopLocation);
            bounds.extend(customerLocation);
            if (driverPos) bounds.extend(driverPos);
            map.fitBounds(bounds);
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

    return (
        <div className={`order-tracking-map-container ${isExpanded ? 'expanded' : ''}`}>
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
                        <span className="eta-label">ETA</span>
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
};

export default React.memo(OrderTrackingMap);
