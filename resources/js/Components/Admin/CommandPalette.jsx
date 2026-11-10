import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { 
    RiCommandLine, 
    RiSearchLine,
    RiDashboardLine, 
    RiShoppingBag3Line, 
    RiAddCircleLine, 
    RiShoppingCart2Line, 
    RiUser3Line, 
    RiSettings3Line, 
    RiAppsLine,
    RiPercentLine,
    RiStarLine,
    RiInboxLine,
    RiDeleteBin7Line,
    RiMoonLine, 
    RiSunLine, 
    RiHomeLine, 
    RiArrowRightLine,
    RiCloseLine,
    RiSparkling2Line
} from 'react-icons/ri';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function CommandPalette({ isOpen, onClose }) {
    const { theme, toggleTheme } = useTheme();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleClearCache = async () => {
        onClose();
        try {
            toast.info('Clearing application cache...');
            const res = await axios.post(route('admin.clear.cache'));
            if (res.data?.success) {
                toast.success('Cache cleared successfully!');
            } else {
                toast.error(res.data?.message || 'Failed to clear cache');
            }
        } catch (err) {
            toast.error('Failed to clear application cache');
        }
    };

    // Actions Registry
    const allActions = [
        // Navigation Group
        {
            id: 'nav-dashboard',
            category: 'Navigation',
            title: 'Dashboard',
            subtitle: 'Overview, analytics & sales stats',
            shortcut: 'Alt + D',
            icon: <RiDashboardLine className="text-blue-500" />,
            run: () => router.visit(route('admin.dashboard')),
        },
        {
            id: 'nav-products',
            category: 'Navigation',
            title: 'Products List',
            subtitle: 'Manage catalog, variations & prices',
            shortcut: 'Alt + P',
            icon: <RiShoppingBag3Line className="text-emerald-500" />,
            run: () => router.visit(route('post.index', { type: 'product' })),
        },
        {
            id: 'nav-new-product',
            category: 'Quick Actions',
            title: 'Add New Product',
            subtitle: 'Create a new product with variations & media',
            shortcut: 'Alt + N',
            icon: <RiAddCircleLine className="text-emerald-600" />,
            run: () => router.visit(route('post.create', { type: 'product' })),
        },
        {
            id: 'nav-categories',
            category: 'Navigation',
            title: 'Product Categories',
            subtitle: 'Manage taxonomy & hierarchy',
            shortcut: 'Alt + C',
            icon: <RiAppsLine className="text-amber-500" />,
            run: () => router.visit(route('taxonomy.index', { type: 'category' })),
        },
        {
            id: 'nav-orders',
            category: 'Navigation',
            title: 'Orders Management',
            subtitle: 'Track invoices, customer shipments & status',
            shortcut: 'Alt + O',
            icon: <RiShoppingCart2Line className="text-amber-600" />,
            run: () => router.visit(route('orders')),
        },
        {
            id: 'nav-customers',
            category: 'Navigation',
            title: 'Customers & Users',
            subtitle: 'Manage registered users and user roles',
            shortcut: 'Alt + U',
            icon: <RiUser3Line className="text-sky-500" />,
            run: () => router.visit(route('users')),
        },
        {
            id: 'nav-reviews',
            category: 'Navigation',
            title: 'Product Reviews',
            subtitle: 'Moderate user reviews and ratings',
            shortcut: 'Alt + R',
            icon: <RiStarLine className="text-yellow-400" />,
            run: () => router.visit(route('admin.reviews.index')),
        },
        {
            id: 'nav-promotions',
            category: 'Navigation',
            title: 'Promotions & Discounts',
            subtitle: 'Setup campaign rules & category discounts',
            shortcut: '',
            icon: <RiPercentLine className="text-rose-500" />,
            run: () => router.visit(route('admin.promotions.index')),
        },
        {
            id: 'nav-inquiries',
            category: 'Navigation',
            title: 'Contact Inquiries',
            subtitle: 'View user messages submitted via Contact Us',
            shortcut: 'Alt + I',
            icon: <RiInboxLine className="text-indigo-400" />,
            run: () => router.visit(route('admin.contact.index')),
        },
        {
            id: 'nav-settings',
            category: 'Navigation',
            title: 'Store Settings',
            subtitle: 'Payment gateways, logo, email & general config',
            shortcut: 'Alt + S',
            icon: <RiSettings3Line className="text-violet-500" />,
            run: () => router.visit(route('admin.setting', { type: 'site' })),
        },
        {
            id: 'nav-payment-settings',
            category: 'Navigation',
            title: 'Payment Gateway Settings',
            subtitle: 'Stripe, PayPal, COD & currency setup',
            shortcut: '',
            icon: <RiSettings3Line className="text-teal-500" />,
            run: () => router.visit(route('admin.setting', { type: 'payment' })),
        },

        // Quick Actions Group
        {
            id: 'act-clear-cache',
            category: 'Quick Actions',
            title: 'Clear Application Cache',
            subtitle: 'Flush config, routes, views & framework cache',
            shortcut: '',
            icon: <RiDeleteBin7Line className="text-red-500" />,
            run: handleClearCache,
        },
        {
            id: 'act-toggle-theme',
            category: 'Quick Actions',
            title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
            subtitle: 'Toggle admin appearance mode',
            shortcut: 'Alt + T',
            icon: theme === 'dark' ? <RiSunLine className="text-amber-400" /> : <RiMoonLine className="text-indigo-400" />,
            run: () => {
                toggleTheme();
                toast.success(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
            },
        },
        {
            id: 'act-storefront',
            category: 'Quick Actions',
            title: 'Open Customer Storefront',
            subtitle: 'Preview public store in a new browser tab',
            shortcut: 'Alt + H',
            icon: <RiHomeLine className="text-teal-500" />,
            run: () => window.open('/', '_blank'),
        },
    ];

    // Filter by query
    const filteredActions = allActions.filter(act => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return act.title.toLowerCase().includes(q) || 
               act.subtitle.toLowerCase().includes(q) ||
               act.category.toLowerCase().includes(q);
    });

    // Keyboard navigation in palette
    useEffect(() => {
        const handlePaletteKeys = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredActions.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredActions[selectedIndex]) {
                    filteredActions[selectedIndex].run();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handlePaletteKeys);
        return () => window.removeEventListener('keydown', handlePaletteKeys);
    }, [isOpen, selectedIndex, filteredActions]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-permanent/40 bg-accent text-heading shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Input Search Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-permanent/30 bg-dynamic/30">
                    <RiSearchLine className="text-xl text-primary shrink-0" />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Type a command or search action (e.g. 'product', 'orders', 'cache')..."
                        className="w-full bg-transparent border-0 text-sm font-medium text-heading placeholder:text-res/60 focus:outline-none focus:ring-0 p-0"
                    />
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-res bg-dynamic/70 border border-permanent/40 rounded shadow-xs">
                        ESC
                    </kbd>
                    <button 
                        onClick={onClose}
                        className="sm:hidden p-1 text-res hover:text-heading"
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-permanent/20">
                    {filteredActions.length === 0 ? (
                        <div className="py-12 text-center text-res text-sm">
                            <RiCommandLine className="size-10 mx-auto text-res/40 mb-2" />
                            No matching command or action found.
                        </div>
                    ) : (
                        filteredActions.map((act, index) => {
                            const isSelected = index === selectedIndex;
                            return (
                                <div
                                    key={act.id}
                                    onClick={() => {
                                        act.run();
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'bg-primary/10 border border-primary/30 text-heading shadow-xs' 
                                            : 'hover:bg-dynamic/40 border border-transparent text-heading'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={`flex size-9 items-center justify-center rounded-xl text-lg shrink-0 ${
                                            isSelected ? 'bg-primary text-white shadow-sm' : 'bg-dynamic/60'
                                        }`}>
                                            {act.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold truncate leading-tight">
                                                    {act.title}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-dynamic/50 text-res">
                                                    {act.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-res truncate mt-0.5">
                                                {act.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        {act.shortcut && (
                                            <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded shadow-2xs">
                                                {act.shortcut}
                                            </kbd>
                                        )}
                                        {isSelected && (
                                            <RiArrowRightLine className="text-primary size-4" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Tips */}
                <div className="flex items-center justify-between px-5 py-2.5 border-t border-permanent/30 bg-dynamic/20 text-[11px] text-res">
                    <div className="flex items-center gap-3">
                        <span><kbd className="font-mono bg-dynamic/60 px-1 py-0.5 rounded border border-permanent/30">↑</kbd> <kbd className="font-mono bg-dynamic/60 px-1 py-0.5 rounded border border-permanent/30">↓</kbd> Navigate</span>
                        <span><kbd className="font-mono bg-dynamic/60 px-1 py-0.5 rounded border border-permanent/30">↵</kbd> Select</span>
                        <span><kbd className="font-mono bg-dynamic/60 px-1 py-0.5 rounded border border-permanent/30">ESC</kbd> Close</span>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 text-primary font-semibold">
                        <RiSparkling2Line size={13} /> Quick Launcher
                    </span>
                </div>
            </div>
        </div>
    );
}

