import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

/**
 * Automatically detects the user's country on site visit via IP/location
 * and saves it into the `user_meta` table if logged in and country is not yet saved.
 */
export default function CountryDetector() {
    const { auth } = usePage().props;
    const user = auth?.user;

    useEffect(() => {
        // Only run for authenticated users
        if (!user || !user.id) return;

        let isMounted = true;

        const saveLocationToMeta = async (locationData) => {
            if (!locationData) return;
            try {
                await axios.post('/api/user/save-country', locationData);
            } catch (err) {
                // Silently fail if unauthorized or rate limited
            }
        };

        const detectCountry = async () => {
            try {
                // Call server endpoint (no CORS restrictions and has fallback)
                const res = await axios.get('/api/detect-country');
                if (isMounted && res.data) {
                    await saveLocationToMeta(res.data);
                    return;
                }
            } catch (err) {
                // Browser Geolocation fallback
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        try {
                            const geoRes = await axios.get('/api/geocode', {
                                params: { q: `${pos.coords.latitude},${pos.coords.longitude}`, limit: 1 }
                            });
                            const feat = geoRes.data?.features?.[0]?.properties;
                            if (isMounted && feat) {
                                await saveLocationToMeta({
                                    country: feat.country || '',
                                    region: feat.state || '',
                                    city: feat.city || '',
                                    postal: feat.postcode || '',
                                    latitude: pos.coords.latitude,
                                    longitude: pos.coords.longitude,
                                });
                            }
                        } catch (_) {}
                    }, () => {});
                }
            }
        };

        detectCountry();

        return () => { isMounted = false; };
    }, [user?.id]);

    return null;
}
