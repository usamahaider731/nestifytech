import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RiMapPin2Line } from 'react-icons/ri';

const MapField = ({ address = '', coordinates = [] }) => {
    const parsedCoordinates = typeof coordinates === 'string'
        ? (() => {
            try {
                return JSON.parse(coordinates);
            } catch {
                return [];
            }
        })()
        : coordinates;
    const [resolvedCoordinates, setResolvedCoordinates] = useState(parsedCoordinates);

    useEffect(() => {
        if (Array.isArray(parsedCoordinates) && parsedCoordinates.length >= 2) {
            setResolvedCoordinates(parsedCoordinates);
            return undefined;
        }

        if (!address || address.trim().length < 3) {
            setResolvedCoordinates([]);
            return undefined;
        }

        const controller = new AbortController();
        axios.get('/api/geocode', {
            params: { q: address, limit: 1 },
            signal: controller.signal,
        }).then((response) => {
            const feature = response.data?.features?.[0];
            const nextCoordinates = feature?.geometry?.coordinates;
            if (Array.isArray(nextCoordinates) && nextCoordinates.length >= 2) {
                setResolvedCoordinates(nextCoordinates);
            }
        }).catch((error) => {
            if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                setResolvedCoordinates([]);
            }
        });

        return () => controller.abort();
    }, [address, coordinates]);

    const hasCoordinates = Array.isArray(resolvedCoordinates) && resolvedCoordinates.length >= 2;
    const [longitude, latitude] = hasCoordinates ? resolvedCoordinates : [null, null];
    const mapDelta = 0.015;
    const mapUrl = hasCoordinates
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - mapDelta}%2C${latitude - mapDelta}%2C${longitude + mapDelta}%2C${latitude + mapDelta}&layer=mapnik&marker=${latitude}%2C${longitude}`
        : '';

    return (
        <div className="flex flex-col gap-2">

            {hasCoordinates ? (
                <div className="overflow-hidden rounded-lg border border-secondary/20 bg-white shadow-sm">
                    <iframe
                        title={`Map for ${address}`}
                        src={mapUrl}
                        className="h-52 w-full border-0"
                        loading="lazy"
                    />
                    <a
                        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block border-t border-secondary/20 px-3 py-2 text-xs font-medium text-primary hover:underline"
                    >
                        Open map in a new tab
                    </a>
                </div>
            ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-secondary/30 bg-white text-xs text-res">
                    The selected address location will appear here.
                </div>
            )}
            <input type="hidden" name="address_coordinates" value={hasCoordinates ? JSON.stringify(resolvedCoordinates) : ''} />
        </div>
    );
};

export default MapField;
