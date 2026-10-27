import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { useLang } from '@/contexts/LanguageContext';
import {
    RiMapPin2Line,
    RiPhoneLine,
    RiMailLine,
    RiGlobalLine,
    RiSearchLine,
    RiMapPinLine,
    RiTimeLine,
    RiArrowRightLine,
    RiBuilding2Line,
    RiNavigationLine,
    RiCloseLine,
    RiMapLine,
    RiListUnordered,
} from 'react-icons/ri';

// ─── Leaflet map loaded via CDN (no npm required) ─────────────────────────────
function MapView({ stores, activeId, onMarkerClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});

    // Inject Leaflet CSS + JS once
    useEffect(() => {
        if (document.getElementById('leaflet-css')) return;
        const css = document.createElement('link');
        css.id = 'leaflet-css';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        const js = document.createElement('script');
        js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        js.onload = () => initMap();
        document.head.appendChild(js);
    }, []);

    function initMap() {
        if (!mapRef.current || mapInstanceRef.current) return;
        const L = window.L;

        // Default center: Pakistan
        const map = L.map(mapRef.current, { zoomControl: true }).setView([30.3753, 69.3451], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        renderMarkers(stores);
    }

    function renderMarkers(storeList) {
        const L = window.L;
        if (!mapInstanceRef.current || !L) return;
        const map = mapInstanceRef.current;

        // Clear existing
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        const validStores = storeList.filter(s => s.latitude && s.longitude);
        if (validStores.length === 0) return;

        const customIcon = (isActive) => L.divIcon({
            className: '',
            html: `<div style="
                width:${isActive ? 40 : 32}px;
                height:${isActive ? 40 : 32}px;
                background:${isActive ? 'var(--color-primary, #6366f1)' : '#fff'};
                border:3px solid ${isActive ? '#fff' : 'var(--color-primary, #6366f1)'};
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                box-shadow:0 4px 15px rgba(0,0,0,.25);
                transition:all .2s;
            "></div>`,
            iconSize: [isActive ? 40 : 32, isActive ? 40 : 32],
            iconAnchor: [isActive ? 20 : 16, isActive ? 40 : 32],
        });

        const bounds = [];
        validStores.forEach(store => {
            const isActive = store.id === activeId;
            const marker = L.marker([store.latitude, store.longitude], { icon: customIcon(isActive) })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:180px;font-family:sans-serif">
                        <strong style="font-size:14px">${store.name}</strong><br/>
                        <small style="color:#666">${[store.city, store.country].filter(Boolean).join(', ')}</small>
                        ${store.phone ? `<br/><small>📞 ${store.phone}</small>` : ''}
                    </div>
                `, { maxWidth: 220 })
                .on('click', () => onMarkerClick(store.id));

            markersRef.current[store.id] = marker;
            bounds.push([store.latitude, store.longitude]);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }
    }

    // Re-render markers when stores or activeId change
    useEffect(() => {
        if (window.L && mapInstanceRef.current) {
            renderMarkers(stores);
        }
    }, [stores, activeId]);

    // Pan to active store
    useEffect(() => {
        if (!mapInstanceRef.current || !activeId) return;
        const marker = markersRef.current[activeId];
        const store = stores.find(s => s.id === activeId);
        if (marker && store?.latitude && store?.longitude) {
            mapInstanceRef.current.setView([store.latitude, store.longitude], 14, { animate: true });
            marker.openPopup();
        }
    }, [activeId]);

    // Wait for script then init
    useEffect(() => {
        const check = setInterval(() => {
            if (window.L && mapRef.current && !mapInstanceRef.current) {
                clearInterval(check);
                initMap();
            }
        }, 100);
        return () => clearInterval(check);
    }, []);

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '100%', minHeight: '480px', borderRadius: '16px', zIndex: 0 }}
        />
    );
}

// ─── Store Card ────────────────────────────────────────────────────────────────
function StoreCard({ store, isActive, onClick }) {
    return (
        <div
            onClick={() => onClick(store.id)}
            className={`store-card ${isActive ? 'store-card--active' : ''}`}
            style={{
                background: isActive ? 'var(--color-primary, #6366f1)' : 'var(--card-bg, #fff)',
                color: isActive ? '#fff' : 'inherit',
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all .25s ease',
                border: `2px solid ${isActive ? 'var(--color-primary, #6366f1)' : 'var(--border-color, #e5e7eb)'}`,
                boxShadow: isActive ? '0 8px 30px rgba(99,102,241,.3)' : '0 2px 8px rgba(0,0,0,.06)',
                marginBottom: '12px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
            }}
        >
            {/* Pin Icon */}
            <div style={{
                width: 44, height: 44, flexShrink: 0, borderRadius: '10px',
                background: isActive ? 'rgba(255,255,255,.2)' : 'var(--color-primary-light, #eef2ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {store.image ? (
                    <img src={store.image} alt={store.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '10px' }} />
                ) : (
                    <RiBuilding2Line size={22} color={isActive ? '#fff' : 'var(--color-primary, #6366f1)'} />
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {store.name}
                </div>
                {store.city || store.country ? (
                    <div style={{ fontSize: '13px', opacity: .8, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <RiMapPin2Line size={13} />
                        {[store.city, store.country].filter(Boolean).join(', ')}
                    </div>
                ) : null}
                {store.address ? (
                    <div style={{ fontSize: '12px', opacity: .65, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {store.address}
                    </div>
                ) : null}
                {store.phone ? (
                    <div style={{ fontSize: '12px', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, opacity: .8 }}>
                        <RiPhoneLine size={12} /> {store.phone}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ─── Store Detail Panel ────────────────────────────────────────────────────────
function StoreDetail({ store, onClose }) {
    if (!store) return null;

    return (
        <div style={{
            background: 'var(--card-bg, #fff)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,.12)',
            border: '1px solid var(--border-color, #e5e7eb)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '12px',
                        background: 'var(--color-primary-light, #eef2ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        overflow: 'hidden',
                    }}>
                        {store.image ? (
                            <img src={store.image} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <RiBuilding2Line size={28} color="var(--color-primary, #6366f1)" />
                        )}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{store.name}</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>
                            {[store.city, store.state, store.country].filter(Boolean).join(', ')}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <RiCloseLine size={22} />
                </button>
            </div>

            {store.description && (
                <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-muted, #6b7280)' }}>
                    {store.description}
                </p>
            )}

            <div style={{ display: 'grid', gap: '12px' }}>
                {store.address && (
                    <InfoRow icon={<RiMapPin2Line size={16} />} label="Address" value={store.address} />
                )}
                {store.phone && (
                    <InfoRow icon={<RiPhoneLine size={16} />} label="Phone">
                        <a href={`tel:${store.phone}`} style={{ color: 'var(--color-primary, #6366f1)', textDecoration: 'none' }}>{store.phone}</a>
                    </InfoRow>
                )}
                {store.email && (
                    <InfoRow icon={<RiMailLine size={16} />} label="Email">
                        <a href={`mailto:${store.email}`} style={{ color: 'var(--color-primary, #6366f1)', textDecoration: 'none' }}>{store.email}</a>
                    </InfoRow>
                )}
                {store.website && (
                    <InfoRow icon={<RiGlobalLine size={16} />} label="Website">
                        <a href={store.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #6366f1)', textDecoration: 'none' }}>
                            {store.website.replace(/^https?:\/\//, '')}
                        </a>
                    </InfoRow>
                )}
            </div>

            {store.latitude && store.longitude && (
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20,
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'var(--color-primary, #6366f1)', color: '#fff',
                        textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                        transition: 'opacity .2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = '.85'}
                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                    <RiNavigationLine size={16} /> Get Directions
                </a>
            )}
        </div>
    );
}

function InfoRow({ icon, label, value, children }) {
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
                width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                background: 'var(--color-primary-light, #eef2ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary, #6366f1)',
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted, #9ca3af)', marginBottom: 2 }}>
                    {label}
                </div>
                <div style={{ fontSize: '14px' }}>
                    {children || value}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StoreLocatorIndex({ stores = [], countries = [] }) {
    const { __ } = useLang();
    const [search, setSearch] = useState('');
    const [activeCountry, setActiveCountry] = useState('all');
    const [activeId, setActiveId] = useState(null);
    const [viewMode, setViewMode] = useState('split'); // 'split' | 'list' | 'map'

    const activeStore = useMemo(() => stores.find(s => s.id === activeId) || null, [stores, activeId]);

    const filtered = useMemo(() => {
        let list = stores;
        if (activeCountry !== 'all') list = list.filter(s => s.country === activeCountry);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.city?.toLowerCase().includes(q) ||
                s.address?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [stores, activeCountry, search]);

    const handleMarkerClick = (id) => setActiveId(id);
    const handleCardClick = (id) => setActiveId(prev => prev === id ? null : id);

    return (
        <FrontendLayout>
            <Head>
                <title>Store Locator</title>
                <meta name="description" content="Find our store locations near you on the map." />
            </Head>

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #8b5cf6 100%)',
                padding: '64px 24px 48px',
                textAlign: 'center',
                color: '#fff',
            }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.15)', marginBottom: 20 }}>
                        <RiMapLine size={32} />
                    </div>
                    <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800 }}>
                        Find a Store Near You
                    </h1>
                    <p style={{ margin: '0 0 28px', fontSize: '16px', opacity: .85 }}>
                        Browse all our locations, get directions, and find contact details.
                    </p>

                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: 440, margin: '0 auto' }}>
                        <RiSearchLine size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 1 }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by city, name, or address…"
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '14px 16px 14px 44px',
                                borderRadius: '12px', border: 'none',
                                fontSize: '15px', outline: 'none',
                                boxShadow: '0 4px 20px rgba(0,0,0,.15)',
                            }}
                        />
                    </div>
                </div>
            </section>

            <div style={{ maxWidth: 1340, margin: '0 auto', padding: '32px 20px' }}>

                {/* Controls row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 24, justifyContent: 'space-between' }}>
                    {/* Country tabs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['all', ...countries].map(c => (
                            <button
                                key={c}
                                onClick={() => { setActiveCountry(c); setActiveId(null); }}
                                style={{
                                    padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '13px', transition: 'all .2s',
                                    background: activeCountry === c ? 'var(--color-primary, #6366f1)' : 'var(--card-bg, #fff)',
                                    color: activeCountry === c ? '#fff' : 'var(--text, #374151)',
                                    boxShadow: activeCountry === c ? '0 4px 12px rgba(99,102,241,.35)' : '0 1px 4px rgba(0,0,0,.08)',
                                }}
                            >
                                {c === 'all' ? `All Stores (${stores.length})` : `${c} (${stores.filter(s => s.country === c).length})`}
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div style={{ display: 'flex', gap: 6, background: 'var(--card-bg, #fff)', padding: 4, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                        {[
                            { mode: 'split', icon: <RiMapPinLine size={16} />, label: 'Split' },
                            { mode: 'list', icon: <RiListUnordered size={16} />, label: 'List' },
                            { mode: 'map', icon: <RiMapLine size={16} />, label: 'Map' },
                        ].map(({ mode, icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600,
                                    background: viewMode === mode ? 'var(--color-primary, #6366f1)' : 'transparent',
                                    color: viewMode === mode ? '#fff' : 'var(--text-muted, #6b7280)',
                                    transition: 'all .2s',
                                }}
                            >
                                {icon} {label}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted, #9ca3af)' }}>
                        <RiMapPinLine size={48} style={{ marginBottom: 16 }} />
                        <h3 style={{ margin: '0 0 8px' }}>No stores found</h3>
                        <p style={{ margin: 0 }}>Try a different search or country filter.</p>
                    </div>
                )}

                {/* Content grid */}
                {filtered.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: viewMode === 'list' ? '1fr' : viewMode === 'map' ? '1fr' : '360px 1fr',
                        gap: 24,
                        alignItems: 'start',
                    }}>
                        {/* Store list panel */}
                        {viewMode !== 'map' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                <div style={{
                                    fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #9ca3af)',
                                    textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14,
                                }}>
                                    {filtered.length} store{filtered.length !== 1 ? 's' : ''} found
                                </div>

                                <div style={{
                                    maxHeight: viewMode === 'list' ? 'none' : '72vh',
                                    overflowY: viewMode === 'list' ? 'visible' : 'auto',
                                    paddingRight: viewMode === 'list' ? 0 : 4,
                                }}>
                                    {viewMode === 'list' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
                                            {filtered.map(store => (
                                                <StoreCard key={store.id} store={store} isActive={activeId === store.id} onClick={handleCardClick} />
                                            ))}
                                        </div>
                                    ) : (
                                        filtered.map(store => (
                                            <StoreCard key={store.id} store={store} isActive={activeId === store.id} onClick={handleCardClick} />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Map + detail panel */}
                        {viewMode !== 'list' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{
                                    borderRadius: '20px', overflow: 'hidden',
                                    boxShadow: '0 8px 40px rgba(0,0,0,.12)',
                                    border: '1px solid var(--border-color, #e5e7eb)',
                                    height: activeStore ? '420px' : '72vh',
                                    minHeight: '400px',
                                    transition: 'height .3s ease',
                                }}>
                                    <MapView stores={filtered} activeId={activeId} onMarkerClick={handleMarkerClick} />
                                </div>

                                {/* Detail panel slides in below map */}
                                {activeStore && (
                                    <StoreDetail store={activeStore} onClose={() => setActiveId(null)} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </FrontendLayout>
    );
}
