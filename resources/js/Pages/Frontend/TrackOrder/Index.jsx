import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { useLang } from '@/contexts/LanguageContext';
import axios from 'axios';
import {
    RiTruckLine,
    RiEBike2Line,
    RiMapPinUserLine,
    RiStore2Line,
    RiSearchLine,
    RiShieldCheckLine,
    RiTimeLine,
    RiCheckboxCircleLine,
    RiCrosshair2Line,
    RiRefreshLine,
    RiNavigationLine,
    RiFileList3Line,
    RiMapPinLine,
    RiCustomerService2Line,
    RiWhatsappLine,
    RiArrowRightLine,
    RiInformationLine,
    RiLoader4Line,
} from 'react-icons/ri';

/* ─── Leaflet Map Component (Esri Street + Satellite, live tracking) ── */
function TrackingMap({ order, riderLocation, userLocation, onEnableLocation, isLocatingUser }) {
    const {setting} = usePage().props;
    console.log(setting.site, order)
    const mapContainerRef = useRef(null);
    const mapInstanceRef  = useRef(null);
    const tileLayerRef    = useRef(null);
    const markersRef      = useRef({ store: null, rider: null, user: null, line: null });
    const boundsInitializedRef = useRef(false); // ← only fitBounds ONCE; never on telemetry polls
    const [mapStyle, setMapStyle] = useState('streets'); // 'streets' | 'satellite'
    const [geocodedUserCoords, setGeocodedUserCoords] = useState(null);

    // ── Geocode the order's database-saved shipping address with multi-tier fallback ──
    useEffect(() => {
        if (!order) return;
        const address = (order.shipping_address || '').trim();
        const city = (order.shipping_city || '').trim();

        const searchQueries = [
            [address, city, 'Pakistan'].filter(Boolean).join(', '),
            [address, 'Pakistan'].filter(Boolean).join(', '),
            [city, 'Pakistan'].filter(Boolean).join(', ')
        ].filter((q, i, arr) => q && arr.indexOf(q) === i);

        let isMounted = true;

        const tryGeocode = async () => {
            for (const q of searchQueries) {
                try {
                    // Try Nominatim with countrycodes=pk
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=pk&format=json&limit=1`);
                    const data = await res.json();
                    if (data && data.length > 0 && isMounted) {
                        setGeocodedUserCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                        return;
                    }

                    // Photon fuzzy search fallback for chak numbers / villages
                    const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
                    const pData = await pRes.json();
                    if (pData?.features?.length > 0 && isMounted) {
                        const coords = pData.features[0].geometry.coordinates;
                        setGeocodedUserCoords([coords[1], coords[0]]);
                        return;
                    }
                } catch (e) {
                    // Try next fallback
                }
            }
        };

        tryGeocode();

        return () => { isMounted = false; };
    }, [order?.shipping_address, order?.shipping_city]);

    const getTileLayer = (style) => {
        const L = window.L;
        if (!L) return null;
        if (style === 'satellite') {
            // Google Maps Hybrid Satellite (Aerial imagery + road labels & place names)
            return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20,
                maxNativeZoom: 20,
            });
        }
        return L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            subdomains: ['0', '1', '2', '3'],
            maxZoom: 20,
            maxNativeZoom: 20,
        });
    };

    const handleStyleChange = (style) => {
        setMapStyle(style);
        const map = mapInstanceRef.current;
        const L = window.L;
        if (!map || !L) return;
        if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = getTileLayer(style);
        if (tileLayerRef.current) tileLayerRef.current.addTo(map);
    };

    useEffect(() => {
        if (document.getElementById('leaflet-css') && window.L) {
            initMap();
            return;
        }
        if (!document.getElementById('leaflet-css')) {
            const css = document.createElement('link');
            css.id = 'leaflet-css';
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(css);
        }
        if (!document.getElementById('leaflet-js')) {
            const js = document.createElement('script');
            js.id = 'leaflet-js';
            js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            js.onload = () => initMap();
            document.head.appendChild(js);
        }
    }, []);

    const initMap = () => {
        if (!mapContainerRef.current || mapInstanceRef.current || !window.L) return;
        const L = window.L;

        const defaultCenter = [30.3753, 69.3451]; // Pakistan center
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            scrollWheelZoom: true,
            attributionControl: false,
        }).setView(defaultCenter, 6);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        tileLayerRef.current = getTileLayer(mapStyle);
        if (tileLayerRef.current) tileLayerRef.current.addTo(map);

        mapInstanceRef.current = map;
        setTimeout(() => {
            map.invalidateSize();
            updateMarkers();
        }, 200);
    };

    const updateMarkers = () => {
        const L = window.L;
        const map = mapInstanceRef.current;
        if (!map || !L) return;

        // Clean previous markers
        Object.values(markersRef.current).forEach(m => { if (m) map.removeLayer(m); });
        markersRef.current = { store: null, rider: null, user: null, line: null };

        const bounds = [];

        // 1. Store / Hub Marker
        const storeCoords = [31.5204, 74.3587];
        bounds.push(storeCoords);

        const storeIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `
                <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#1e293b,#334155);border:3px solid #fff;box-shadow:0 8px 24px rgba(0,0,0,0.35);color:#fff;">
                    <svg fill="currentColor" viewBox="0 0 24 24" width="22" height="22"><path d="M21 13V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V13H2V11L3 6H21L22 11V13H21ZM5 13V19H19V13H5ZM6 14H14V17H6V14ZM3 4H21V6H3V4Z"/></svg>
                    <span style="position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;"></span>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
        });

        markersRef.current.store = L.marker(storeCoords, { icon: storeIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:system-ui;padding:6px 2px;"><strong style="font-size:13px;color:#1e293b;display:block;margin-bottom:2px;">🏭 NestifyTech Hub</strong><span style="font-size:11px;color:#64748b;">Order Dispatch & Warehouse</span></div>`);

        // 2. Customer Destination Marker: Always prioritize the database-saved address from the order
        let userCoords = null;
        if (geocodedUserCoords) {
            userCoords = geocodedUserCoords;
        } else if (userLocation?.latitude && userLocation?.longitude) {
            userCoords = [userLocation.latitude, userLocation.longitude];
        } else {
            userCoords = [31.5204, 74.3587];
        }
        bounds.push(userCoords);

        const userIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `
                <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border:3px solid #fff;box-shadow:0 8px 24px rgba(79,70,229,0.45);color:#fff;">
                    <svg fill="currentColor" viewBox="0 0 24 24" width="22" height="22"><path d="M12 20.8995L16.9497 15.9497C18.2759 14.6236 19.0208 12.8257 19.0208 10.9497C19.0208 7.08375 15.8868 3.94974 12.0208 3.94974C8.15482 3.94974 5.02081 7.08375 5.02081 10.9497C5.02081 12.8257 5.76576 14.6236 7.09188 15.9497L12 20.8995ZM12 23.7279L5.67767 17.4056C4.01353 15.7415 3.02081 13.4373 3.02081 10.9497C3.02081 5.97919 7.05025 1.94974 12.0208 1.94974C16.9914 1.94974 21.0208 5.97919 21.0208 10.9497C21.0208 13.4373 20.0281 15.7415 18.364 17.4056L12 23.7279ZM12 13.9497C10.3639 13.9497 9.02081 12.6066 9.02081 10.9497C9.02081 9.29289 10.3639 7.94974 12 7.94974C13.6361 7.94974 14.9792 9.29289 14.9792 10.9497C14.9792 12.6066 13.6361 13.9497 12 13.9497Z"/></svg>
                    <span style="position:absolute;top:-4px;right:-4px;display:flex;width:14px;height:14px;">
                        <span style="animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;position:absolute;display:inline-flex;border-radius:50%;width:100%;height:100%;background:rgba(99,102,241,0.7);"></span>
                        <span style="position:relative;display:inline-flex;border-radius:50%;width:14px;height:14px;background:#6366f1;"></span>
                    </span>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
        });

        markersRef.current.user = L.marker(userCoords, { icon: userIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:system-ui;padding:6px 2px;"><strong style="font-size:13px;color:#4f46e5;display:block;margin-bottom:2px;">📍 Delivery Destination</strong><span style="font-size:11px;color:#64748b;">${order?.shipping_address || 'Customer Location'}, ${order?.shipping_city || ''}</span></div>`);
        if (riderLocation?.latitude && riderLocation?.longitude) {
            const riderCoords = [riderLocation.latitude, riderLocation.longitude];
            bounds.push(riderCoords);
            const riderIcon = L.divIcon({
                className: 'custom-map-icon',
                html: `
                    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,#059669,#10b981);border:3px solid #fff;box-shadow:0 10px 28px rgba(16,185,129,0.5);color:#fff;">
                        <svg fill="currentColor" viewBox="0 0 24 24" width="26" height="26"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
                        <span style="position:absolute;top:-5px;right:-5px;display:flex;width:16px;height:16px;">
                            <span style="animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;position:absolute;display:inline-flex;border-radius:50%;width:100%;height:100%;background:rgba(52,211,153,0.7);"></span>
                            <span style="position:relative;display:inline-flex;border-radius:50%;width:16px;height:16px;background:#10b981;border:2px solid #fff;"></span>
                        </span>
                    </div>
                `,
                iconSize: [50, 50],
                iconAnchor: [25, 25],
            });

            markersRef.current.rider = L.marker(riderCoords, { icon: riderIcon })
                .addTo(map)
                .bindPopup(`<div style="font-family:system-ui;padding:6px 2px;min-width:150px;"><strong style="font-size:13px;color:#059669;display:block;margin-bottom:2px;">🛵 Rider On Route</strong><p style="font-size:12px;color:#1e293b;margin:2px 0;">${order?.rider_name || 'Delivery Partner'}</p><span style="font-size:10px;color:#64748b;">Live GPS Active</span></div>`);

            // Dashed route line: rider → customer
            markersRef.current.line = L.polyline([riderCoords, userCoords], {
                color: '#10b981', weight: 4, dashArray: '10, 8', opacity: 0.85,
            }).addTo(map);
        } else {
            // Static route line: store → customer
            markersRef.current.line = L.polyline([storeCoords, userCoords], {
                color: '#6366f1', weight: 3, dashArray: '7, 7', opacity: 0.6,
            }).addTo(map);
        }

        if (!boundsInitializedRef.current) {
            // Only auto-zoom on very first placement — never on 15s telemetry polls
            if (bounds.length > 1) {
                map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
            } else {
                map.setView(bounds[0], 16);
            }
            boundsInitializedRef.current = true;
        }
    };

    // Reset bounds lock when the order itself changes (new order searched)
    useEffect(() => { boundsInitializedRef.current = false; }, [order?.id]);

    useEffect(() => { updateMarkers(); }, [order, riderLocation, userLocation, geocodedUserCoords]);

    return (
        <div className="relative w-full max-sm:aspect-square sm:h-[460px] rounded-xl sm:rounded-2xl overflow-hidden border border-border shadow-lg">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Style Toggle (top-left) */}
            <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-border shadow-md">
                <button
                    type="button"
                    onClick={() => handleStyleChange('streets')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${mapStyle === 'streets' ? 'bg-primary text-white shadow-sm' : 'text-heading hover:bg-primary/10'}`}
                >
                    Streets
                </button>
                <button
                    type="button"
                    onClick={() => handleStyleChange('satellite')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${mapStyle === 'satellite' ? 'bg-primary text-white shadow-sm' : 'text-heading hover:bg-primary/10'}`}
                >
                    Satellite
                </button>
            </div>

            {/* GPS Enable Button (top-right) */}
            <div className="absolute sm:top-3 top-1.5 right-1.5 sm:right-3 z-20">
                <button
                    type="button"
                    onClick={onEnableLocation}
                    disabled={isLocatingUser}
                    className="px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-border text-xs font-bold text-heading hover:text-primary shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                    {isLocatingUser ? (
                        <RiLoader4Line className="size-4 animate-spin text-primary" />
                    ) : (
                        <RiCrosshair2Line className="size-4 text-emerald-500" />
                    )}
                    <span>{userLocation ? 'Update GPS' : 'My Location'}</span>
                </button>
            </div>

            {/* Rider Telemetry Badge (bottom-left) */}
            <div className="absolute bottom-4 left-4 z-20">
                <div className="px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-white shadow-xl text-xs flex items-center gap-2.5">
                    <span className={`size-2.5 rounded-full ${riderLocation ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <div>
                        <span className="font-semibold block text-[11px] text-slate-300">Rider Telemetry</span>
                        <span className="font-bold text-xs">
                            {riderLocation ? 'Connected & Broadcasting' : 'Awaiting Live GPS Signal'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Track Order Page ─────────────────────────────────────────── */
export default function TrackOrder({ initialCode, initialOrder, riderLocation: propRiderLocation }) {
    const { __ } = useLang();
    const [searchCode, setSearchCode] = useState(initialCode || '');
    const [order, setOrder] = useState(initialOrder || null);
    const [riderLocation, setRiderLocation] = useState(propRiderLocation || null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

    // Customer's browser geolocation (only activated if user explicitly clicks 'Update GPS')
    const [userLocation, setUserLocation] = useState(null);
    const [isLocatingUser, setIsLocatingUser] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const handleGetCustomerLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported by this browser.');
            return;
        }
        setIsLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
                setIsLocatingUser(false);
                setLocationError(null);
            },
            (err) => {
                const msg = err.code === 1
                    ? 'Location permission denied. Please allow location in your browser.'
                    : 'Could not get precise GPS. Your order address will be used instead.';
                console.warn('Geolocation:', msg);
                setLocationError(msg);
                setIsLocatingUser(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0, // No cached ISP location — always fresh GPS!
            }
        );
    };

    // Auto-polling rider location every 15 seconds if order is active
    useEffect(() => {
        if (!order || ['completed', 'cancelled'].includes((order.status || '').toLowerCase())) {
            return;
        }

        const interval = setInterval(() => {
            fetchLiveTelemetry(order.id, true);
        }, 15000);

        return () => clearInterval(interval);
    }, [order]);

    const fetchLiveTelemetry = async (idOrTracking, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await axios.get(route('api.orders.tracking', { idOrTracking }));
            if (res.data?.success) {
                if (res.data.order) {
                    setOrder(prev => ({ ...prev, ...res.data.order }));
                }
                if (res.data.rider_location) {
                    setRiderLocation(res.data.rider_location);
                }
                setLastUpdated(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error('Failed to update live tracking:', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchCode.trim()) return;
        router.get(route('track.order', { trackingNumber: searchCode.trim() }), {}, {
            preserveState: true,
            onSuccess: (page) => {
                setOrder(page.props.initialOrder || null);
                setRiderLocation(page.props.riderLocation || null);
            }
        });
    };

    // Status timeline stages
    const STAGES = [
        { key: 'pending', title: __('Order Placed'), desc: __('Awaiting warehouse processing') },
        { key: 'processing', title: __('In Fulfillment'), desc: __('Items packed & boxed') },
        { key: 'shipped', title: __('Out for Delivery'), desc: __('Handed to courier rider') },
        { key: 'completed', title: __('Delivered'), desc: __('Verified via customer OTP') },
    ];

    const currentStatus = (order?.status || 'pending').toLowerCase();
    const stageIdx = {
        pending: 0,
        processing: 1,
        shipped: 2,
        delivered: 3,
        completed: 3,
    }[currentStatus] ?? 0;

    return (
        <FrontendLayout title={__('Live Order Tracker & Rider Map')}>
            <Head title={__('Live Order Tracking - NestifyTech')} />
            <div className="bg-bg py-8 sm:py-12 min-h-screen">
                <div className="container mx-auto px-4 max-w-6xl space-y-8">
                    <div className="bg-white rounded-xl sm:rounded-3xl border border-border p-5 sm:p-8 shadow-sm text-center max-w-3xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            <RiEBike2Line className="size-4" />
                            {__('Real-Time Telemetry & GPS')}
                        </div>
                        <h1 className="text-2xl font-poppins sm:text-4xl font-bold sm:font-extrabold text-heading tracking-tight">
                            {__('Track Your Order in Real-Time')}
                        </h1>
                        <p className="text-xs sm:text-sm text-res max-w-xl mx-auto">
                            {__('Enter your order ID or unique tracking number to monitor your package dispatch, assigned delivery rider location, and estimated arrival.')}
                        </p>

                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto pt-2">
                            <div className="relative w-full">
                                <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-res size-5" />
                                <input
                                    type="text"
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value)}
                                    placeholder={__('Enter Order # or Tracking Code (e.g. NST-2610-XYZ)')}
                                    className="w-full pl-11 pr-4 py-3 bg-bg border-2 border-border focus:border-primary rounded-2xl text-sm font-semibold text-heading focus:outline-hidden transition-all placeholder:text-res/60 shadow-xs"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                            >
                                {loading ? <RiLoader4Line className="animate-spin size-5" /> : <RiNavigationLine className="size-5" />}
                                <span>{__('Track')}</span>
                            </button>
                        </form>
                    </div>

                    {order ? (
                        <div className="space-y-8">
                            {/* ── Status Timeline Card ── */}
                            <div className="bg-white rounded-xl sm:rounded-3xl border border-border p-6 sm:p-8 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-heading">{order.order_number || `Order #${order.id}`}</h2>
                                            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase">
                                                {order.status}
                                            </span>
                                        </div>
                                        {order.tracking_number && (
                                            <p className="text-xs text-res mt-1 font-mono">
                                                {__('Tracking Number')}: <strong className="text-heading font-bold">{order.tracking_number}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[11px] text-res block">{__('Total Amount')}</span>
                                        <span className="text-xl font-extrabold text-primary font-mono">
                                            ${order.total_price?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Timeline Steps */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
                                    {STAGES.map((stg, i) => {
                                        const isDone = i <= stageIdx;
                                        const isCurrent = i === stageIdx;
                                        return (
                                            <div
                                                key={stg.key}
                                                className={`p-4 rounded-2xl border transition-all ${
                                                    isCurrent
                                                        ? 'bg-primary/5 border-primary shadow-sm'
                                                        : isDone
                                                        ? 'bg-white border-emerald-500/30'
                                                        : 'bg-bg/40 border-border opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                        {isDone ? '✓' : i + 1}
                                                    </span>
                                                    <span className="font-bold text-xs text-heading">{stg.title}</span>
                                                </div>
                                                <p className="text-[11px] text-res">{stg.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Live Map & Telemetry Section ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex sm:items-center flex-col sm:flex-row  justify-between">
                                        <h3 className="font-bold text-lg text-heading flex items-center gap-2">
                                            <RiNavigationLine className="text-emerald-500" />
                                            {__('Live Rider & Destination Map')}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-res">
                                            <RiTimeLine />
                                            <span>{__('Synced')}: {lastUpdated}</span>
                                            <button
                                                type="button"
                                                onClick={() => fetchLiveTelemetry(order.id)}
                                                className="p-1 hover:text-primary transition-colors cursor-pointer"
                                                title="Refresh Telemetry"
                                            >
                                                <RiRefreshLine className="size-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Map Component */}
                                    <TrackingMap
                                        order={order}
                                        riderLocation={riderLocation}
                                        userLocation={userLocation}
                                        onEnableLocation={handleGetCustomerLocation}
                                        isLocatingUser={isLocatingUser}
                                    />
                                </div>

                                {/* Delivery Rider & Shipping Info Sidebar */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-heading flex items-center gap-2">
                                        <RiEBike2Line className="text-primary" />
                                        {__('Courier & Rider Info')}
                                    </h3>

                                    <div className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
                                                🛵
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-heading">
                                                    {order.rider_name || __('Express Delivery Rider')}
                                                </h4>
                                                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                                    <RiCheckboxCircleLine />
                                                    {__('Verified NestifyTech Partner')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-bg rounded-xl border border-border text-xs space-y-1.5">
                                            <div className="flex justify-between">
                                                <span className="text-res">{__('Carrier')}:</span>
                                                <span className="font-semibold text-heading">{order.shipping_carrier || 'NestifyTech Logistics'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-res">{__('Payment Mode')}:</span>
                                                <span className="font-semibold text-heading uppercase">{order.payment_method}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-res">{__('Payment Status')}:</span>
                                                <span className="font-semibold text-emerald-600">{order.payment_status}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[11px] font-semibold text-res uppercase tracking-wider block mb-1">
                                                {__('Destination Address')}
                                            </span>
                                            <p className="text-xs font-medium text-heading bg-bg p-3 rounded-xl border border-border">
                                                {order.shipping_address}
                                            </p>
                                        </div>

                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[11px] text-primary space-y-1">
                                            <strong className="block font-bold">{__('Security Notice')}:</strong>
                                            <span>{__('For cash-on-delivery or secure handoff, inspect your parcel and only share the 6-digit verification code directly with the rider upon arrival.')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-border p-12 text-center max-w-xl mx-auto space-y-3">
                            <RiTruckLine className="size-14 text-res mx-auto opacity-50" />
                            <h3 className="text-lg font-bold text-heading">{__('No Order Selected')}</h3>
                            <p className="text-xs text-res">
                                {__('Please enter your tracking code above to inspect live courier movement and delivery status.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </FrontendLayout>
    );
}
