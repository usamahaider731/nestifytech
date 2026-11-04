import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { useLang } from '@/contexts/LanguageContext';
import { RiDeleteBinLine, RiSecurePaymentLine, RiTruckLine, RiShieldCheckLine, RiBankCardLine, RiPaypalLine, RiHandCoinLine, RiGlobalLine, RiAlertLine, RiGiftLine, RiCheckLine, RiCloseLine, RiMapPinLine, RiCrosshairLine, RiSearchLine, RiArrowUpSFill, RiArrowDownSFill, RiFocus3Line, RiCompass3Line, RiSparklingLine, RiMap2Line } from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useCart } from '@/contexts/CartContext';
import { selectCartItems, selectCartCount, selectCartTotal, setComboQty, removeFromCart, clearCart, syncPrices } from '@/store/cartSlice';
import { useSelector, useDispatch } from 'react-redux';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import QuantitySelector from '@/Components/Single/QuantitySelector';
import axios from 'axios';
import { toast } from 'react-toastify';

function CheckoutFormContent() {
    const { setting, auth } = usePage().props;
    const user = auth?.user;
    const { __ } = useLang();

    // ── Leaflet & Map state ───────────────────────────────────────────────────
    const mapContainerRef = useRef(null);
    const mapInstanceRef  = useRef(null);
    const tileLayerRef    = useRef(null);
    const markerRef       = useRef(null);
    const pulseCircleRef  = useRef(null);
    const [mapStyle, setMapStyle]           = useState('streets'); // 'streets' | 'satellite' | 'osm'
    const [mapReady, setMapReady]           = useState(false);
    const [mapExpanded, setMapExpanded]     = useState(false);
    const [gpsLoading, setGpsLoading]       = useState(false);
    const [searchQuery, setSearchQuery]     = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [isMapDragging, setIsMapDragging] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState({ lat: null, lng: null });
    const [selectedLabel, setSelectedLabel]   = useState('');
    const lastGeocodedCityRef = useRef('');
    const searchDebounceRef = useRef(null);
    const moveDebounceRef = useRef(null);

    const dispatch = useDispatch();
    const stripe = useStripe();
    const elements = useElements();

    const items = useSelector(selectCartItems);
    const itemCount = useSelector(selectCartCount);
    const subtotal = useSelector(selectCartTotal);

    const [giftCardInput, setGiftCardInput] = useState('');
    const [appliedGiftCard, setAppliedGiftCard] = useState(null);
    const [verifyingGiftCard, setVerifyingGiftCard] = useState(false);

    const currency = setting?.site?.currency?.value ?? 'PKR';
    const totalAmount = subtotal;
    const shippingAmount = totalAmount > 0 ? Number(setting?.site?.shipping?.value ?? setting?.site?.shipping ?? 0) : 0;

    // Gift card discount amount (capped to order total before shipping or including shipping)
    const giftCardDiscount = appliedGiftCard
        ? Math.min(appliedGiftCard.remaining_balance, totalAmount + shippingAmount)
        : 0;
    const finalAmount = Math.max(0, totalAmount + shippingAmount - giftCardDiscount);

    const handleApplyGiftCard = async (e) => {
        if (e) e.preventDefault();
        const codeToTest = giftCardInput.trim().toUpperCase();
        if (!codeToTest) {
            toast.error('Please enter a gift card code');
            return;
        }

        setVerifyingGiftCard(true);
        try {
            const res = await axios.post('/api/gift-card/validate', { code: codeToTest });
            if (res.data.success) {
                setAppliedGiftCard({
                    code: res.data.code,
                    remaining_balance: res.data.remaining_balance,
                    expires_at: res.data.expires_at,
                });
                toast.success(res.data.message || 'Gift card applied successfully!');
                setGiftCardInput('');
            } else {
                toast.error(res.data.message || 'Invalid gift card code');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Invalid or expired gift card code.';
            toast.error(msg);
        } finally {
            setVerifyingGiftCard(false);
        }
    };

    const handleRemoveGiftCard = () => {
        setAppliedGiftCard(null);
        toast.info('Gift card removed');
    };

    // Detect enabled payment gateways from setting.json
    const paymentSettings = setting?.payment || {};
    const stripeEnabled = paymentSettings.stripe_enabled?.value ?? true;
    // PayPal: only show if enabled AND a real client_id is configured
    const paypalClientId = paymentSettings.paypal_client_id?.value || '';
    const paypalEnabled = (paymentSettings.paypal_enabled?.value ?? false)
        && paypalClientId.length > 0
        && !paypalClientId.includes('@'); // exclude placeholder emails
    // COD: enabled by default
    const codEnabled = paymentSettings.cod_enabled?.value ?? true;
    // Payoneer: only show if enabled AND a real program_id is configured
    const payoneerProgramId = paymentSettings.payoneer_program_id?.value || '';
    const payoneerEnabled = (paymentSettings.payoneer_enabled?.value ?? false)
        && payoneerProgramId.length > 0;

    // Determine default payment method
    const defaultMethod = useMemo(() => {
        if (codEnabled) return 'cod';
        if (stripeEnabled) return 'card';
        if (paypalEnabled) return 'paypal';
        if (payoneerEnabled) return 'payoneer';
        return 'cod';
    }, [codEnabled, stripeEnabled, paypalEnabled, payoneerEnabled]);

    const nameParts = (user?.name || '').trim().split(' ');
    const initialFirstName = nameParts[0] || '';
    const initialLastName = nameParts.slice(1).join(' ') || '';

    const [form, setForm] = useState({
        first_name: initialFirstName,
        last_name: initialLastName,
        email: user?.email || '',
        phone: user?.meta?.phone || '',
        address: user?.meta?.address || '',
        city: user?.meta?.city || '',
        postal_code: user?.meta?.postal_code || '',
        payment_method: defaultMethod
    });

    // ── Helper: reverse geocode coordinate (multi-language support) ──────────
    const reverseGeocode = useCallback(async (lat, lng) => {
        setIsReverseGeocoding(true);
        try {
            // First try Photon reverse geocoding
            const photonRes = await fetch(
                `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`
            );
            const photonData = await photonRes.json();
            if (photonData?.features?.length > 0) {
                const p = photonData.features[0].properties;
                const detectedCity = p.city || p.town || p.district || p.state || '';
                const parts = [p.name, p.street, p.district, p.city].filter(Boolean);
                const cleanAddress = parts.slice(0, 3).join(', ');
                const postcode = p.postcode || '';

                if (detectedCity) {
                    lastGeocodedCityRef.current = detectedCity;
                }

                setForm(prev => ({
                    ...prev,
                    address: cleanAddress || prev.address,
                    city: detectedCity || prev.city,
                    postal_code: postcode || prev.postal_code,
                }));

                const label = cleanAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                setSelectedLabel(label);
                return;
            }

            // Fallback to OpenStreetMap Nominatim with multi-language
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            const data = await res.json();
            if (data && data.address) {
                const addr = data.address;
                const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
                const road = addr.road || addr.residential || addr.suburb || addr.neighbourhood || '';
                const postcode = addr.postcode || '';
                const cleanAddress = [road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 3).join(',');

                if (detectedCity) {
                    lastGeocodedCityRef.current = detectedCity;
                }

                setForm(prev => ({
                    ...prev,
                    address: cleanAddress || prev.address,
                    city: detectedCity || prev.city,
                    postal_code: postcode || prev.postal_code,
                }));

                const label = cleanAddress || data.display_name.split(',').slice(0, 2).join(',');
                setSelectedLabel(label);
            }
        } catch (e) {
            // Silently retain current coords
        } finally {
            setIsReverseGeocoding(false);
        }
    }, []);

    // ── Place marker with high-end glowing pulse effect ───────────────────────
    const placeMarker = useCallback((lat, lng, label, shouldReverse = true) => {
        if (!window.L || !mapInstanceRef.current) return;
        const L = window.L;

        if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
        }
        if (pulseCircleRef.current) {
            mapInstanceRef.current.removeLayer(pulseCircleRef.current);
            pulseCircleRef.current = null;
        }

        // Soft pulsing radius circle around pin
        pulseCircleRef.current = L.circle([lat, lng], {
            radius: 120,
            color: '#6366f1',
            fillColor: '#818cf8',
            fillOpacity: 0.22,
            weight: 2,
            dashArray: '4, 6',
        }).addTo(mapInstanceRef.current);

        // Modern glowing pin design
        const pinHtml = `
            <div style="position:relative; width:42px; height:42px;">
                <div style="position:absolute; inset:-6px; border-radius:50%; background:rgba(99,102,241,0.3); animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
                <div style="position:relative; width:40px; height:40px; background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:3px solid #ffffff; box-shadow:0 10px 25px -5px rgba(79,70,229,0.5), 0 8px 10px -6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
                    <div style="width:14px; height:14px; background:#ffffff; border-radius:50%; margin:auto; transform:rotate(45deg); box-shadow:inset 0 1px 3px rgba(0,0,0,0.3);"></div>
                </div>
            </div>
        `;

        markerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-delivery-marker',
                html: pinHtml,
                iconAnchor: [21, 41],
                popupAnchor: [0, -38],
            }),
            draggable: true,
        }).addTo(mapInstanceRef.current);

        markerRef.current.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            setSelectedCoords({ lat: pos.lat, lng: pos.lng });
            if (pulseCircleRef.current) pulseCircleRef.current.setLatLng(pos);
            reverseGeocode(pos.lat, pos.lng);
        });

        const initialLabel = label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        markerRef.current.bindPopup(`
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
                <strong style="color: #4f46e5; display: block; margin-bottom: 2px;">📍 Delivery Location</strong>
                <span>${initialLabel}</span>
            </div>
        `).openPopup();

        setSelectedCoords({ lat, lng });
        setSelectedLabel(initialLabel);

        if (shouldReverse) {
            reverseGeocode(lat, lng);
        }
    }, [reverseGeocode]);

    // ── High-detail tile providers (Google Maps Streets with complete Pakistan & Chak names) ──
    const getTileLayer = useCallback((style) => {
        const L = window.L;
        if (!L) return null;

        if (style === 'satellite') {
            // Google Maps Hybrid Satellite (High-res satellite + labels)
            return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20,
                maxNativeZoom: 20,
            });
        }
        // Google Maps Standard Streets (Includes 53/2-L, 54/2-L, all chaks, landmarks, colonies & Urdu labels)
        return L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            subdomains: ['0', '1', '2', '3'],
            maxZoom: 20,
            maxNativeZoom: 20,
        });
    }, []);

    const changeMapStyle = (newStyle) => {
        setMapStyle(newStyle);
        if (!mapInstanceRef.current || !window.L) return;
        if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current);
        }
        tileLayerRef.current = getTileLayer(newStyle);
        if (tileLayerRef.current) {
            tileLayerRef.current.addTo(mapInstanceRef.current);
        }
    };

    // ── Load Leaflet CSS + JS safely ──────────────────────────────────────────
    const initMap = useCallback(() => {
        if (mapInstanceRef.current || !mapContainerRef.current) return;
        const L = window.L;
        if (!L) return;

        const startLat = selectedCoords.lat || 30.3753;
        const startLng = selectedCoords.lng || 69.3451;
        const startZoom = selectedCoords.lat ? 14 : 5;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([startLat, startLng], startZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        tileLayerRef.current = getTileLayer(mapStyle);
        if (tileLayerRef.current) tileLayerRef.current.addTo(map);

        mapInstanceRef.current = map;

        // Foodpanda-style: When user drags/pans the map, the center pin lifts up,
        // and when user stops moving, reverse geocode the exact center position!
        map.on('movestart', () => {
            setIsMapDragging(true);
            setShowResultsDropdown(false);
            if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
        });

        map.on('move', () => {
            const center = map.getCenter();
            setSelectedCoords({ lat: center.lat, lng: center.lng });
        });

        map.on('moveend', () => {
            setIsMapDragging(false);
            const center = map.getCenter();
            setSelectedCoords({ lat: center.lat, lng: center.lng });

            if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
            moveDebounceRef.current = setTimeout(() => {
                reverseGeocode(center.lat, center.lng);
            }, 450);
        });

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setShowResultsDropdown(false);
            map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
        });

        // Initialize center coordinates on first load
        const initialCenter = map.getCenter();
        setSelectedCoords({ lat: initialCenter.lat, lng: initialCenter.lng });

        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 300);
    }, [getTileLayer, mapStyle, reverseGeocode, selectedCoords.lat, selectedCoords.lng]);

    const loadLeaflet = useCallback(() => {
        if (window.L) {
            initMap();
            return;
        }

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => initMap();
            document.head.appendChild(script);
        } else {
            const interval = setInterval(() => {
                if (window.L) {
                    clearInterval(interval);
                    initMap();
                }
            }, 100);
        }
    }, [initMap]);

    useEffect(() => {
        if (mapExpanded) {
            loadLeaflet();
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 350);
        }
    }, [mapExpanded, loadLeaflet]);

    // ── Auto-Detect City in any language (Urdu, English, etc.) ─────────────────
    useEffect(() => {
        const cityQuery = form.city?.trim();
        if (!cityQuery || cityQuery.length < 2) return;
        if (lastGeocodedCityRef.current.toLowerCase() === cityQuery.toLowerCase()) return;

        const timer = setTimeout(async () => {
            try {
                // Try Photon first with multilingual query
                const photonRes = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(cityQuery)}&limit=1`
                );
                const photonData = await photonRes.json();
                if (photonData?.features?.length > 0) {
                    const feat = photonData.features[0];
                    const [lngN, latN] = feat.geometry.coordinates;
                    lastGeocodedCityRef.current = cityQuery;
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([latN, lngN], 12, { duration: 1.2 });
                        if (!selectedCoords.lat) {
                            placeMarker(latN, lngN, `${cityQuery}`, false);
                        }
                    }
                    return;
                }

                // Fallback to nominatim
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=1`
                );
                const data = await res.json();
                if (data && data.length > 0) {
                    lastGeocodedCityRef.current = cityQuery;
                    const latN = parseFloat(data[0].lat);
                    const lngN = parseFloat(data[0].lon);
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([latN, lngN], 12, { duration: 1.2 });
                        if (!selectedCoords.lat) {
                            placeMarker(latN, lngN, `${cityQuery}`, false);
                        }
                    }
                }
            } catch (e) {
                // Ignore transient lookup failure
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [form.city, placeMarker, selectedCoords.lat]);

    // ── Multi-language live search (Photon & Nominatim fallback) ──────────────
    const performSearch = useCallback(async (text) => {
        const query = text.trim();
        if (!query) {
            setSearchResults([]);
            setShowResultsDropdown(false);
            return;
        }

        setSearchLoading(true);
        try {
            // 1. Photon search (supports Urdu, Roman Urdu, English, fuzzy names)
            const photonRes = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
            );
            const photonData = await photonRes.json();

            let results = [];
            if (photonData?.features?.length > 0) {
                results = photonData.features.map(f => {
                    const p = f.properties;
                    const title = p.name || p.street || p.city || 'Location';
                    const subtitle = [p.street, p.district, p.city, p.country].filter(Boolean).join(', ');
                    return {
                        title,
                        subtitle,
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0],
                    };
                });
            }

            // 2. Nominatim with Pakistan focus (essential for finding Chaks like 53/2L, specific colonies & villages)
            if (results.length < 5) {
                // Try with countrycodes=pk filter
                const searchQ = query.toLowerCase().includes('pakistan') ? query : `${query}, Pakistan`;
                const nomRes = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&countrycodes=pk&format=json&limit=6`
                );
                const nomData = await nomRes.json();
                if (nomData && nomData.length > 0) {
                    const nomResults = nomData.map(item => ({
                        title: item.display_name.split(',')[0],
                        subtitle: item.display_name.split(',').slice(1, 4).join(', '),
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                    }));
                    // Deduplicate
                    const existingTitles = new Set(results.map(r => r.title.toLowerCase()));
                    nomResults.forEach(r => {
                        if (!existingTitles.has(r.title.toLowerCase())) {
                            results.push(r);
                        }
                    });
                }
            }

            setSearchResults(results.slice(0, 8));
            setShowResultsDropdown(results.length > 0);
        } catch {
            // Keep existing
        } finally {
            setSearchLoading(false);
        }
    }, []);

    // Instant suggestions while typing
    const handleSearchInputChange = (val) => {
        setSearchQuery(val);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (val.trim().length >= 2) {
            searchDebounceRef.current = setTimeout(() => {
                performSearch(val);
            }, 350);
        } else {
            setSearchResults([]);
            setShowResultsDropdown(false);
        }
    };

    const handleSelectSearchResult = (result) => {
        setShowResultsDropdown(false);
        setSearchQuery(result.title);
        const lat = result.lat;
        const lng = result.lng;
        setSelectedCoords({ lat, lng });
        setSelectedLabel(`${result.title}, ${result.subtitle}`);
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1 });
        }
        setForm(prev => ({
            ...prev,
            address: prev.address || `${result.title}, ${result.subtitle}`,
        }));
        toast.success(`Selected: ${result.title}`);
    };

    const handleGps = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                if (!mapExpanded) setMapExpanded(true);
                setSelectedCoords({ lat, lng });
                setTimeout(() => {
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1 });
                    }
                    reverseGeocode(lat, lng);
                    setGpsLoading(false);
                    toast.success('Found your location!');
                }, 300);
            },
            (err) => {
                const message = err.code === 1 
                    ? 'Location permission denied. Please allow location in your browser settings.' 
                    : 'Could not acquire precise GPS. Try searching your area (e.g. Okara).';
                toast.error(message);
                setGpsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0, // Force fresh real-time GPS, no cached ISP location!
            }
        );
    };


    React.useEffect(() => {
        if (user) {
            const parts = (user?.name || '').trim().split(' ');
            setForm((prev) => ({
                ...prev,
                first_name: prev.first_name || parts[0] || '',
                last_name: prev.last_name || parts.slice(1).join(' ') || '',
                email: prev.email || user.email || '',
                phone: prev.phone || user.meta?.phone || '',
                address: prev.address || user.meta?.address || '',
                city: prev.city || user.meta?.city || '',
                postal_code: prev.postal_code || user.meta?.postal_code || '',
            }));
        }
    }, [user]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [priceChangedItems, setPriceChangedItems] = useState([]); // items whose price was updated from server
    // Synchronous guard — prevents duplicate submissions before React re-renders
    const processingRef = useRef(false);

    // ── Live price sync on mount ─────────────────────────────────────────────
    // Prices are stored in localStorage when a product is added to cart.
    // If an admin changes a price in the backend, the cart shows stale data.
    // This effect fetches fresh prices from the server and updates the Redux
    // store + localStorage, then shows a banner listing changed items.
    useEffect(() => {
        if (items.length === 0) return;
        const payload = items.map(i => ({
            comboId: i.comboId,
            productId: i.productId,
            colorId: i.colorId ?? null,
        }));
        axios.post('/api/cart/prices', { items: payload })
            .then(res => {
                const priceMap = res.data; 
                const changed = [];
                items.forEach(item => {
                    const freshPrice = priceMap[String(item.comboId)];
                    if (freshPrice !== undefined && freshPrice !== null && Number(freshPrice) !== Number(item.price)) {
                        changed.push({
                            title: item.title,
                            oldPrice: item.price,
                            newPrice: Number(freshPrice),
                        });
                    }
                });
                if (changed.length > 0) {
                    dispatch(syncPrices(priceMap));
                    setPriceChangedItems(changed);
                }
            })
            .catch(() => { /* silently ignore — prices from localStorage are still usable */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (processingRef.current || isProcessing) return;
        processingRef.current = true;
        setIsProcessing(true);
        setPaymentError(null);

        let orderSuccess = false;

        if (form.payment_method === 'card') {
            if (!stripe || !elements) {
                processingRef.current = false;
                setIsProcessing(false);
                return;
            }

            try {
                // Create PaymentIntent on the server
                const piRes = await axios.post('/checkout/create-payment-intent', {
                    amount: finalAmount,
                    currency: currency.toLowerCase(),
                });

                const data = piRes.data;

                if (data.error) {
                    setPaymentError(data.error);
                    processingRef.current = false;
                    setIsProcessing(false);
                    return;
                }

                const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
                    payment_method: {
                        card: elements.getElement(CardElement),
                        billing_details: {
                            name: `${form.first_name} ${form.last_name}`,
                            email: form.email,
                            phone: form.phone,
                            address: {
                                city: form.city,
                                line1: form.address,
                                postal_code: form.postal_code,
                            }
                        },
                    },
                });

                if (error) {
                    setPaymentError(error.message);
                    processingRef.current = false;
                    setIsProcessing(false);
                    return;
                }

                if (paymentIntent.status === 'succeeded') {
                    // 1. Place the order with the payment intent ID
                    const orderRes = await axios.post('/api/cart/order', {
                        items: items,
                        payment_method: 'card',
                        payment_intent_id: paymentIntent.id,
                        first_name: form.first_name,
                        last_name: form.last_name,
                        email: form.email,
                        phone: form.phone,
                        address: form.address || selectedLabel || form.city,
                        city: form.city,
                        postal_code: form.postal_code || '',
                        gift_card_code: appliedGiftCard ? appliedGiftCard.code : null,
                        delivery_lat: selectedCoords.lat,
                        delivery_lng: selectedCoords.lng,
                    });

                    const orderData = orderRes.data;

                    if (!orderData.success) {
                        setPaymentError(orderData.message || 'Failed to place order.');
                        processingRef.current = false;
                        setIsProcessing(false);
                        return;
                    }

                    orderSuccess = true;
                    dispatch(clearCart());
                    toast.success(`Payment successful! Your order #${orderData.order_id} has been placed.`);
                    router.visit(user ? route('profile.orders') : route('index'));
                }
            } catch (err) {
                const errMsg = err?.response?.data?.message || err?.response?.data?.error || 'An error occurred while processing your payment. Please try again.';
                setPaymentError(errMsg);
            } finally {
                // Keep locked if order succeeded so rapid clicks while navigation occurs cannot re-trigger
                if (!orderSuccess) {
                    processingRef.current = false;
                    setIsProcessing(false);
                }
            }

        } else {
            try {
                const orderRes = await axios.post('/api/cart/order', {
                    items: items,
                    payment_method: form.payment_method,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    phone: form.phone,
                    address: form.address || selectedLabel || form.city,
                    city: form.city,
                    postal_code: form.postal_code || '',
                    gift_card_code: appliedGiftCard ? appliedGiftCard.code : null,
                    delivery_lat: selectedCoords.lat,
                    delivery_lng: selectedCoords.lng,
                });
                const orderData = orderRes.data;
                if (orderData.success) {
                    orderSuccess = true;
                    const methodLabels = {
                        cod: 'Cash on Delivery',
                        paypal: 'PayPal',
                        payoneer: 'Payoneer'
                    };
                    const label = methodLabels[form.payment_method] || form.payment_method.toUpperCase();
                    toast.success(`Order #${orderData.order_id} placed successfully via ${label}!`);
                    dispatch(clearCart());
                    router.visit(user ? route('profile.orders') : route('index'));
                } else {
                    const msg = orderData.message || 'Failed to place order.';
                    setPaymentError(msg);
                    toast.error(msg);
                }
            } catch (err) {
                const errMsg = err?.response?.data?.message || err?.response?.data?.error || 'An error occurred while placing your order. Please try again.';
                setPaymentError(errMsg);
                toast.error(errMsg);
            } finally {
                if (!orderSuccess) {
                    processingRef.current = false;
                    setIsProcessing(false);
                }
            }
        }
    };
    return (
        <div className="bg-bg min-h-screen py-10">
            <Head title="Secure Checkout" />
            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-heading">Secure Checkout</h1>
                    <p className="text-res mt-2">Please review your order and enter your delivery details.</p>
                </div>
                {items.length === 0 ? (
                    <div className="bg-white rounded-md  p-12 text-center shadow-sm border border-permanent/10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <RiSecurePaymentLine className="size-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-heading mb-4">Your Cart is Empty</h2>
                        <p className="text-res mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Head back to the store and find something you love!</p>
                        <Link href="/" className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            {/* ── Price-changed banner ──────────────────────────── */}
                            {priceChangedItems.length > 0 && (
                                <div className="mb-5 p-4 rounded-xl border border-amber-400/60 bg-amber-50 flex gap-3 items-start">
                                    <RiAlertLine className="size-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 text-sm">
                                        <p className="font-bold text-amber-800 mb-1">Some prices have been updated</p>
                                        <p className="text-amber-700 mb-2">The following items in your cart had price changes since you last visited. Totals have been updated automatically.</p>
                                        <ul className="space-y-1">
                                            {priceChangedItems.map((p, i) => (
                                                <li key={i} className="flex items-center gap-2 text-amber-800">
                                                    <span className="font-medium line-clamp-1 flex-1">{p.title}</span>
                                                    <span className="line-through text-amber-500">{currency} {Number(p.oldPrice).toLocaleString()}</span>
                                                    <span className="font-bold text-amber-800">→ {currency} {Number(p.newPrice).toLocaleString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button type="button" onClick={() => setPriceChangedItems([])} className="text-amber-400 hover:text-amber-600 shrink-0 text-lg leading-none">✕</button>
                                </div>
                            )}
                            <form id="checkout-form" onSubmit={handleSubmit} className="bg-white rounded p-6 md:p-8 shadow-sm border border-permanent/10">
                                <h3 className="text-xl font-bold text-heading mb-6 pb-4 border-b border-permanent/10">Delivery Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-heading mb-2">First Name</label>
                                        <input required type="text" name="first_name" value={form.first_name} onChange={handleChange} className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden" placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-heading mb-2">Last Name</label>
                                        <input required type="text" name="last_name" value={form.last_name} onChange={handleChange} className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden" placeholder="Doe" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">Email Address</label>
                                        <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden" placeholder="john@example.com" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">Phone Number</label>
                                        <input required type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden" placeholder="+92 300 1234567" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">City</label>
                                        <input required type="text" name="city" value={form.city} onChange={handleChange} className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden" placeholder="e.g. Lahore, Karachi, Islamabad" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-semibold text-heading">Street / Delivery Address</label>
                                            <span className="text-xs text-res">Auto-syncs with map pin</span>
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden"
                                            placeholder="House / Apartment #, Street, Area / Sector"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">Postal / Zip Code <span className="text-xs font-normal text-res">(optional)</span></label>
                                        <input
                                            type="text"
                                            name="postal_code"
                                            value={form.postal_code}
                                            onChange={handleChange}
                                            className="w-full bg-bg border border-border focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-4 py-3 text-sm text-text transition-all outline-hidden"
                                            placeholder="e.g. 54000"
                                        />
                                    </div>
                                </div>

                                {/* ── Map Address Picker ────────────────────────────── */}
                                <div className="mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setMapExpanded(v => !v)}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-primary font-semibold text-sm"
                                    >
                                        <span className="flex items-center gap-2">
                                            <RiMapPinLine className="size-5" />
                                            {selectedCoords.lat
                                                ? '📍 Delivery pin set — click to update'
                                                : 'Pin your exact delivery location on map (optional)'}
                                        </span>
                                        <span className="text-xs font-normal flex items-center gap-1 opacity-70">{mapExpanded ? 
                                        <><RiArrowUpSFill size={18} /> Hide map</> : 
                                        <><RiArrowDownSFill size={18} /> Show map</>
                                        }</span>
                                    </button>

                                    {selectedCoords.lat && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                            <RiCheckLine className="size-4 shrink-0" />
                                            <span className="truncate"><strong>Pinned:</strong> {selectedLabel}</span>
                                            <button type="button" onClick={() => { setSelectedCoords({ lat: null, lng: null }); setSelectedLabel(''); if (markerRef.current && mapInstanceRef.current) { mapInstanceRef.current.removeLayer(markerRef.current); markerRef.current = null; } }} className="ml-auto text-red-400 hover:text-red-600">
                                                <RiCloseLine className="size-4" />
                                            </button>
                                        </div>
                                    )}

                                    {mapExpanded && (
                                        <div className="mt-3 rounded-2xl overflow-hidden border border-primary/20 shadow-xl bg-white transition-all">
                                            {/* Map Toolbar & Multi-Language Search */}
                                            <div className="p-3 bg-gradient-to-r from-bg to-white border-b border-permanent/10 space-y-2.5">
                                                <div className="flex flex-col sm:flex-row gap-2 relative">
                                                    <div className="relative flex-1">
                                                        <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-res" />
                                                        <input
                                                            type="text"
                                                            value={searchQuery}
                                                            onChange={e => handleSearchInputChange(e.target.value)}
                                                            onFocus={() => { if (searchResults.length > 0) setShowResultsDropdown(true); }}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    performSearch(searchQuery);
                                                                }
                                                            }}
                                                            placeholder="Search in English, اردو (e.g. مال روڈ، گلبرگ), or landmark..."
                                                            className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                                                        />
                                                        {searchLoading && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => performSearch(searchQuery)}
                                                            disabled={searchLoading}
                                                            className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                                                        >
                                                            {searchLoading ? 'Searching...' : 'Search'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleGps}
                                                            disabled={gpsLoading}
                                                            title="Detect my current GPS location"
                                                            className="px-3.5 py-2.5 rounded-xl border border-primary/40 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 text-sm font-medium shadow-xs active:scale-95"
                                                        >
                                                            <RiCrosshairLine className={`size-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                                                            <span className="hidden sm:inline">GPS</span>
                                                        </button>
                                                    </div>

                                                    {/* Auto-suggest dropdown with multi-language results */}
                                                    {showResultsDropdown && searchResults.length > 0 && (
                                                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-permanent/10 z-1000 max-h-60 overflow-y-auto divide-y divide-border/60">
                                                            {searchResults.map((item, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => handleSelectSearchResult(item)}
                                                                    className="w-full text-left px-4 py-2.5 hover:bg-primary/5 transition-colors flex items-start gap-3 cursor-pointer group"
                                                                >
                                                                    <RiMapPinLine className="size-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-semibold text-heading truncate">{item.title}</div>
                                                                        {item.subtitle && (
                                                                            <div className="text-xs text-res truncate">{item.subtitle}</div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Map style selector & Quick City chips */}
                                                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                                    {/* Quick city presets */}
                                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs text-res scrollbar-none flex-1 min-w-0">
                                                        <span className="shrink-0 flex items-center gap-1 text-primary font-medium mr-1">
                                                            <RiCompass3Line className="size-3.5" /> Jump:
                                                        </span>
                                                        {['Okara', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Sahiwal', 'Multan', 'Gujranwala', 'Peshawar'].map((c) => (
                                                            <button
                                                                key={c}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(prev => ({ ...prev, city: c }));
                                                                    setSearchQuery(c);
                                                                    performSearch(c);
                                                                }}
                                                                className={`shrink-0 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${form.city?.toLowerCase() === c.toLowerCase() ? 'bg-primary text-white border-primary font-bold shadow-xs' : 'bg-white hover:bg-primary/10 border-border text-heading'}`}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Map Theme Toggle (Streets / Satellite / OpenStreetMap) */}
                                                    <div className="flex items-center gap-1 bg-bg p-1 rounded-lg border border-border shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => changeMapStyle('streets')}
                                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${mapStyle === 'streets' ? 'bg-white text-primary shadow-xs font-bold' : 'text-res hover:text-heading'}`}
                                                        >
                                                            Streets
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => changeMapStyle('satellite')}
                                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${mapStyle === 'satellite' ? 'bg-white text-primary shadow-xs font-bold' : 'text-res hover:text-heading'}`}
                                                        >
                                                            Satellite
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => changeMapStyle('osm')}
                                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${mapStyle === 'osm' ? 'bg-white text-primary shadow-xs font-bold' : 'text-res hover:text-heading'}`}
                                                        >
                                                            OSM
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Foodpanda-style Map Container with Interactive Fixed Center Pin */}
                                            <div className="relative overflow-hidden select-none">
                                                <div ref={mapContainerRef} style={{ height: '390px', width: '100%', background: '#e5e7eb' }} />
                                                
                                                {/* Foodpanda Fixed Center Marker with Lift Animation on Drag */}
                                                <div 
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-500 transition-all duration-200 ease-out flex flex-col items-center"
                                                    style={{
                                                        transform: isMapDragging 
                                                            ? 'translate(-50%, -100%) scale(1.15) translateY(-14px)' 
                                                            : 'translate(-50%, -100%) scale(1) translateY(0px)'
                                                    }}
                                                >
                                                    {/* Address bubble above pin (Foodpanda style) */}
                                                    <div className="mb-1.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-primary/20 text-xs font-semibold text-heading max-w-[260px] truncate text-center flex items-center gap-1.5">
                                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                                        <span className="truncate">
                                                            {isMapDragging ? 'Move map to pinpoint...' : (selectedLabel || 'Set delivery location here')}
                                                        </span>
                                                    </div>

                                                    {/* Foodpanda Pin Icon */}
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-500 p-1 shadow-2xl flex items-center justify-center border-2 border-white">
                                                            <RiMapPinLine className="size-5 text-white" />
                                                        </div>
                                                        {/* Pin stem pointer */}
                                                        <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-primary mx-auto -mt-0.5"></div>
                                                    </div>

                                                    {/* Dynamic Ground Shadow that shrinks when pin lifts up */}
                                                    <div 
                                                        className="rounded-full bg-black/30 blur-[2px] transition-all duration-200 -mt-1"
                                                        style={{
                                                             width: isMapDragging ? '10px' : '16px',
                                                             height: isMapDragging ? '3px' : '6px',
                                                             opacity: isMapDragging ? 0.35 : 0.7,
                                                        }}
                                                    ></div>
                                                </div>

                                                {/* Floating quick GPS Recenter Button (Foodpanda style bottom-right) */}
                                                <button
                                                    type="button"
                                                    onClick={handleGps}
                                                    disabled={gpsLoading}
                                                    title="Recenter on my current location"
                                                    className="absolute bottom-4 right-4 z-500 size-11 rounded-full bg-white text-heading shadow-xl border border-border hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center cursor-pointer active:scale-90"
                                                >
                                                    <RiCrosshairLine className={`size-5 text-primary ${gpsLoading ? 'animate-spin' : ''}`} />
                                                </button>

                                                {!mapReady && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-bg/85 backdrop-blur-xs text-sm text-heading font-medium z-10">
                                                        <div className="flex flex-col items-center gap-2">
                                                             <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                             <span>Loading map...</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Live reverse geocode floating pill indicator */}
                                                {isReverseGeocoding && (
                                                    <div className="absolute top-3 left-3 z-500 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-primary/20 text-xs font-medium text-primary flex items-center gap-2 animate-bounce">
                                                        <div className="size-2 rounded-full bg-primary animate-ping"></div>
                                                        <span>Locating exact street...</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status / Instructions Footer */}
                                            <div className="px-4 py-2.5 bg-gradient-to-r from-white via-primary/5 to-white border-t border-permanent/10 text-xs text-res flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-heading font-medium">
                                                    <RiMapPinLine className="size-4 text-primary shrink-0" />
                                                    <span>Pan or drag map to place pin at your exact doorstep</span>
                                                </div>
                                                {selectedCoords.lat && (
                                                    <span className="text-[11px] text-primary/80 font-mono">
                                                        {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-heading mb-4 pb-4 border-b border-permanent/10 mt-8">Payment Method</h3>
                                <div className="space-y-3 mb-8">
                                    {/* Cash on Delivery */}
                                    {codEnabled && (
                                        <label className={`flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="cod" checked={form.payment_method === 'cod'} onChange={handleChange} className="sm:w-5 w-4 sm:h-5 h-4 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiHandCoinLine className="sm:size-5 size-4 text-primary" />
                                                    <span className="block font-semibold sm:font-bold font-roboto text-heading text-xs sm:text-sm">Cash on Delivery (COD)</span>
                                                </div>
                                                <span className="block text-[11px] sm:text-xs text-res mt-1">
                                                    {paymentSettings.cod_instructions?.value || 'Pay in cash upon delivery of your items.'}
                                                </span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Credit / Debit Card (Stripe) */}
                                    {stripeEnabled && (
                                        <label className={`flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'card' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="card" checked={form.payment_method === 'card'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiBankCardLine className="sm:size-5 size-4 text-primary" />
                                                    <span className="block font-semibold font-roboto sm:font-bold text-heading text-xs sm:text-sm">Credit / Debit Card (Stripe)</span>
                                                </div>
                                                <span className="block text-[11px] sm:text-xs text-res mt-1">Pay instantly with Visa, MasterCard, or American Express</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* PayPal */}
                                    {paypalEnabled && (
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'paypal' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="paypal" checked={form.payment_method === 'paypal'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiPaypalLine className="size-5 text-[#0070ba]" />
                                                    <span className="block font-bold text-heading">PayPal</span>
                                                </div>
                                                <span className="block text-xs text-res mt-1">Pay securely via PayPal account balance or saved card</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Payoneer */}
                                    {payoneerEnabled && (
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'payoneer' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="payoneer" checked={form.payment_method === 'payoneer'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiGlobalLine className="size-5 text-[#ff4800]" />
                                                    <span className="block font-bold text-heading">Payoneer</span>
                                                </div>
                                                <span className="block text-xs text-res mt-1">Global payment & mass checkout via Payoneer</span>
                                            </div>
                                        </label>
                                    )}

                                    {!codEnabled && !stripeEnabled && !paypalEnabled && !payoneerEnabled && (
                                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
                                            No payment gateways are currently enabled in the Admin Settings.
                                        </div>
                                    )}
                                </div>

                                {form.payment_method === 'card' && stripeEnabled && (
                                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-semibold text-heading mb-4">Card Details</label>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <CardElement options={{
                                                style: {
                                                    base: {
                                                        fontSize: '16px',
                                                        color: '#424770',
                                                        '::placeholder': {
                                                            color: '#aab7c4',
                                                        },
                                                    },
                                                    invalid: {
                                                        color: '#9e2146',
                                                    },
                                                },
                                            }} />
                                        </div>
                                        {paymentError && <div className="text-red-500 text-sm mt-3">{paymentError}</div>}
                                    </div>
                                )}

                                {form.payment_method === 'paypal' && (
                                    <div className="mb-8 p-5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                                        <RiPaypalLine className="size-6 text-[#0070ba] shrink-0 mt-0.5" />
                                        <div className="text-xs text-heading">
                                            <p className="font-semibold text-sm">PayPal Checkout Active</p>
                                            <p className="text-res mt-1">When clicking "Place Order", your order will be initialized with PayPal secure checkout.</p>
                                        </div>
                                    </div>
                                )}

                                {form.payment_method === 'payoneer' && (
                                    <div className="mb-8 p-5 rounded-xl border border-orange-200 bg-orange-50/60 flex items-start gap-3">
                                        <RiGlobalLine className="size-6 text-[#ff4800] shrink-0 mt-0.5" />
                                        <div className="text-xs text-heading">
                                            <p className="font-semibold text-sm">Payoneer Checkout Active</p>
                                            <p className="text-res mt-1">Your order will be processed through your Payoneer global account checkout.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-permanent/10">
                                    <div className="flex items-center gap-3 text-sm text-res font-medium">
                                        <RiTruckLine className="size-5 text-primary" /> Free Returns
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-res font-medium">
                                        <RiShieldCheckLine className="size-5 text-primary" /> Secure Checkout
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-[450px] shrink-0">
                            <div className="bg-white rounded p-6 shadow-sm border border-permanent/10 sticky top-28">
                                <h3 className="text-xl font-bold text-heading mb-6 pb-4 border-b border-permanent/10">Order Summary</h3>

                                <div className="max-h-[300px] overflow-y-auto scroll-hidden pr-2 space-y-4 mb-6">
                                    {items.map((item, idx) => (
                                        <div key={item.comboId ?? item.id ?? idx} className="flex sm:flex-row last:border-b-0 border-b border-b-border flex-col gap-4">
                                            <div className="sm:w-16 sm:h-16 w-full rounded-md shrink-0 flex items-center justify-center p-1.5 border border-permanent">
                                                <ImageViwer image={item.image} height={900} width={900} alt={item.title} className="w-full h-full object-cover sm:object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-semibold text-xs sm:text-sm text-heading line-clamp-2">{item.title}</h4>
                                                    <button type="button" onClick={() => dispatch(removeFromCart(item.comboId))} className="text-red-400 hover:text-red-500 p-1">
                                                        <RiDeleteBinLine className="size-4" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-start sm:items-center justify-between mt-2">
                                                    <QuantitySelector

                                                        selectedStock={item.qty}
                                                        minStock={1}
                                                        maxStock={item.maxStock}
                                                        onChange={(newQty) => {
                                                            if (newQty > item.maxStock) {
                                                                toast.error("Maximum quantity reached");
                                                                return;
                                                            }
                                                            dispatch(setComboQty({ comboId: item.comboId, qty: newQty }))
                                                        }} />
                                                    <span className="font-bold text-primary text-sm">
                                                        {currency} {Number(item.price * item.qty).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Gift Card Input / Applied Card */}
                                <div className="pt-4 border-t border-permanent/10 mb-5">
                                    {!appliedGiftCard ? (
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <RiGiftLine className="absolute left-3 top-1/2 -translate-y-1/2 text-primary size-4" />
                                                <input
                                                    type="text"
                                                    placeholder="Gift Card Code"
                                                    value={giftCardInput}
                                                    onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyGiftCard())}
                                                    className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase rounded-lg border border-permanent/20 bg-transparent text-heading focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleApplyGiftCard}
                                                disabled={verifyingGiftCard}
                                                className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                            >
                                                {verifyingGiftCard ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs">
                                            <div className="flex items-center gap-2">
                                                <RiCheckLine className="size-4" />
                                                <div>
                                                    <span className="font-mono font-bold tracking-wider">{appliedGiftCard.code}</span>
                                                    <span className="ml-1 text-[11px] opacity-80">(Bal: {currency} {Number(appliedGiftCard.remaining_balance).toLocaleString()})</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveGiftCard}
                                                className="text-red-400 hover:text-red-500 p-1"
                                                title="Remove Gift Card"
                                            >
                                                <RiCloseLine className="size-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-permanent/10 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-res font-medium">Subtotal</span>
                                        <span className="font-bold text-heading">{currency} {totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-res font-medium">Shipping</span>
                                        <span className="font-bold text-heading">{currency} {shippingAmount.toLocaleString()}</span>
                                    </div>
                                    {appliedGiftCard && giftCardDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <RiGiftLine className="size-3.5" /> Gift Card Discount
                                            </span>
                                            <span className="font-bold">-{currency} {giftCardDiscount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-permanent/20 mb-8">
                                    <span className="font-bold text-heading text-lg">Total</span>
                                    <span className="font-semibold font-poppins text-primary text-xl">{currency} {finalAmount.toLocaleString()}</span>
                                </div>

                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isProcessing}
                                    className={`w-full bg-primary text-white rounded py-4 font-medium font-poppins text-lg shadow-lg shadow-primary/30 transition-transform flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed pointer-events-none' : 'hover:-translate-y-1'}`}
                                >
                                    <RiSecurePaymentLine className="size-5" />
                                    {isProcessing ? 'Processing...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Checkout() {
    const { setting } = usePage().props;

    // Resolve the Stripe publishable key from settings (secret keys are stripped server-side)
    const stripeKey =
        setting?.payment?.stripe_key?.value ||
        setting?.payment?.stripe_publishable_key?.value ||
        setting?.stripe?.stripe_key?.value ||
        import.meta.env.VITE_STRIPE_KEY ||
        null;

    // loadStripe is safe to call with null — Elements will simply not initialise Stripe
    const stripePromise = useMemo(
        () => (stripeKey ? loadStripe(stripeKey) : null),
        [stripeKey]
    );

    return (
        <Elements stripe={stripePromise}>
            <CheckoutFormContent />
        </Elements>
    );
}

Checkout.layout = (view) => <FrontendLayout>{view}</FrontendLayout>;
