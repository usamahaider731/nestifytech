import React, { useState, useEffect, useRef } from 'react';
import {
    RiEyeLine,
    RiExternalLinkLine,
    RiSmartphoneLine,
    RiTabletLine,
    RiComputerLine,
    RiCloseLine,
    RiRefreshLine,
    RiLockLine,
    RiHome4Line,
    RiShoppingBag3Line,
    RiGiftLine,
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiArrowRightLine,
} from 'react-icons/ri';

export default function StorePreviewModal({ isOpen, onClose }) {
    const [device, setDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
    const [currentPath, setCurrentPath] = useState('/');
    const [urlInput, setUrlInput] = useState('/');
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset url when opened
    useEffect(() => {
        if (isOpen) {
            setUrlInput(currentPath);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const quickLinks = [
        { label: 'Home', path: '/', icon: <RiHome4Line size={13} /> },
        { label: 'Shop', path: '/shop', icon: <RiShoppingBag3Line size={13} /> },
        { label: 'Gift Cards', path: '/gift-cards', icon: <RiGiftLine size={13} /> },
    ];

    const getFrameWidth = () => {
        switch (device) {
            case 'mobile':
                return 'w-[390px] h-[780px] rounded-[36px] border-[10px] border-slate-800 shadow-2xl';
            case 'tablet':
                return 'w-[768px] h-[860px] rounded-2xl border-[8px] border-slate-800 shadow-2xl';
            default:
                return 'w-full h-full rounded-b-xl border border-permanent/20';
        }
    };

    const handleNavigate = (path) => {
        let cleanPath = path.trim();
        if (!cleanPath) cleanPath = '/';

        // Extract relative pathname if full URL is entered
        if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
            try {
                const parsed = new URL(cleanPath);
                cleanPath = parsed.pathname + parsed.search;
            } catch (_) {
                cleanPath = '/';
            }
        } else if (!cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }

        setIsLoading(true);
        setCurrentPath(cleanPath);
        setUrlInput(cleanPath);

        if (iframeRef.current) {
            iframeRef.current.src = cleanPath;
        }
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        handleNavigate(urlInput);
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                const loc = iframeRef.current.contentWindow.location;
                // Only sync if on same origin
                if (loc.origin === window.location.origin) {
                    const activePath = loc.pathname + loc.search;
                    if (activePath && activePath !== currentPath) {
                        setCurrentPath(activePath);
                        setUrlInput(activePath);
                    }
                }
            }
        } catch (_) {
            // Silently handle if cross-origin policy restricts
        }
    };

    const handleRefresh = () => {
        setIsLoading(true);
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.location.reload();
            } else if (iframeRef.current) {
                iframeRef.current.src = currentPath;
            }
        } catch (_) {
            if (iframeRef.current) {
                iframeRef.current.src = currentPath;
            }
        }
    };

    const handleBack = () => {
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.history.back();
            }
        } catch (_) {}
    };

    const handleForward = () => {
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.history.forward();
            }
        } catch (_) {}
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-accent rounded-2xl border border-permanent/40 shadow-2xl overflow-hidden">
                
                {/* ── Top Control Bar ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-bg/95 border-b border-permanent/30">
                    
                    {/* Left: Branding & Navigation Controls */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 pr-2 border-r border-permanent/20">
                            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                <RiEyeLine className="text-primary text-base" /> Preview
                            </span>
                        </div>

                        {/* Back / Forward Buttons */}
                        <div className="flex items-center gap-0.5 bg-accent/70 p-0.5 rounded-lg border border-permanent/20">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="p-1.5 rounded text-secondary hover:text-heading hover:bg-bg/60 transition-colors"
                                title="Back in history"
                            >
                                <RiArrowLeftSLine size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleForward}
                                className="p-1.5 rounded text-secondary hover:text-heading hover:bg-bg/60 transition-colors"
                                title="Forward in history"
                            >
                                <RiArrowRightSLine size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                className="p-1.5 rounded text-secondary hover:text-heading hover:bg-bg/60 transition-colors"
                                title="Refresh page"
                            >
                                <RiRefreshLine size={14} className={isLoading ? 'animate-spin text-primary' : ''} />
                            </button>
                        </div>

                        {/* Quick Page Links */}
                        <div className="hidden md:flex items-center gap-1 bg-accent/60 p-1 rounded-lg border border-permanent/20">
                            {quickLinks.map((link) => (
                                <button
                                    key={link.path}
                                    type="button"
                                    onClick={() => handleNavigate(link.path)}
                                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                        currentPath === link.path
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-secondary hover:text-heading hover:bg-bg/60'
                                    }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Interactive Browser URL Address Bar */}
                    <form
                        onSubmit={handleUrlSubmit}
                        className="flex-1 max-w-md mx-2 flex items-center gap-2 px-3 py-1.5 bg-accent/90 focus-within:bg-accent rounded-lg border border-permanent/30 focus-within:border-primary transition-all text-xs text-secondary"
                    >
                        <RiLockLine className="text-emerald-500 shrink-0 text-sm" />
                        <span className="text-[11px] font-mono text-secondary/70 shrink-0 select-none hidden sm:inline">
                            {window.location.origin}
                        </span>
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="/shop or page url..."
                            className="w-full bg-transparent border-0 p-0 text-[11px] font-mono text-heading focus:outline-none focus:ring-0 placeholder:text-secondary/50"
                        />
                        <button
                            type="submit"
                            className="p-1 rounded bg-bg hover:bg-primary hover:text-white text-secondary transition-all"
                            title="Go to URL (Enter)"
                        >
                            <RiArrowRightLine size={12} />
                        </button>
                    </form>

                    {/* Right: Device Switchers & Actions */}
                    <div className="flex items-center gap-2">
                        {/* Device Toggles */}
                        <div className="flex items-center bg-accent/80 p-1 rounded-lg border border-permanent/20">
                            <button
                                type="button"
                                onClick={() => setDevice('desktop')}
                                className={`p-1.5 rounded text-xs transition-colors ${
                                    device === 'desktop' ? 'bg-primary text-white shadow-xs' : 'text-secondary hover:text-heading'
                                }`}
                                title="Desktop View"
                            >
                                <RiComputerLine size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDevice('tablet')}
                                className={`p-1.5 rounded text-xs transition-colors ${
                                    device === 'tablet' ? 'bg-primary text-white shadow-xs' : 'text-secondary hover:text-heading'
                                }`}
                                title="Tablet View (768px)"
                            >
                                <RiTabletLine size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDevice('mobile')}
                                className={`p-1.5 rounded text-xs transition-colors ${
                                    device === 'mobile' ? 'bg-primary text-white shadow-xs' : 'text-secondary hover:text-heading'
                                }`}
                                title="Mobile View (390px)"
                            >
                                <RiSmartphoneLine size={16} />
                            </button>
                        </div>

                        {/* Open in New Tab */}
                        <a
                            href={currentPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-bg hover:bg-bg/80 text-heading rounded-lg border border-permanent/30 transition-all shadow-xs"
                            title="Open current page in new browser tab"
                        >
                            <span className="hidden sm:inline">New Tab</span>
                            <RiExternalLinkLine size={14} />
                        </a>

                        {/* Close */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg text-secondary hover:text-red-500 hover:bg-red-500/10 border border-transparent transition-colors ml-1 cursor-pointer"
                            title="Close Preview (Esc)"
                        >
                            <RiCloseLine size={20} />
                        </button>
                    </div>
                </div>

                {/* ── Viewport Area ── */}
                <div className="relative flex-1 w-full bg-slate-900/60 p-2 sm:p-4 overflow-auto flex items-center justify-center">
                    
                    {/* Device Bezel & Iframe */}
                    <div className={`relative transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 ${getFrameWidth()}`}>
                        
                        {/* Mobile Speaker Notch */}
                        {device === 'mobile' && (
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center pointer-events-none">
                                <div className="w-10 h-1 bg-slate-600 rounded-full" />
                            </div>
                        )}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-bg/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
                                <div className="size-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                                <span className="text-xs font-medium text-secondary">Loading page...</span>
                            </div>
                        )}

                        <iframe
                            ref={iframeRef}
                            src={currentPath}
                            title="Live Store Preview"
                            onLoad={handleIframeLoad}
                            className="w-full h-full border-0 select-auto"
                        />
                    </div>
                </div>

                {/* ── Bottom Info Bar ── */}
                <div className="px-4 py-2 bg-bg/80 border-t border-permanent/20 flex items-center justify-between text-[11px] text-secondary">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-1.5 rounded-full bg-green-500" />
                        Active page: <span className="text-heading font-mono">{currentPath}</span>
                    </span>
                    <span className="hidden sm:inline font-mono">
                        Mode: {device.toUpperCase()} • Type URL above and press <kbd className="px-1 py-0.5 bg-accent rounded text-[10px] border border-permanent/30">Enter</kbd>
                    </span>
                </div>
            </div>
        </div>
    );
}
