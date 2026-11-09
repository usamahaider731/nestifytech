import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    RiCommandLine, 
    RiCloseLine, 
    RiDashboardLine, 
    RiShoppingBag3Line, 
    RiShoppingCart2Line, 
    RiUser3Line, 
    RiSettings3Line, 
    RiAddCircleLine, 
    RiMoonLine, 
    RiSunLine, 
    RiHomeLine, 
    RiKey2Line,
    RiSearchLine,
    RiAppsLine,
    RiStarLine,
    RiInboxLine
} from 'react-icons/ri';
import { useTheme } from '@/contexts/ThemeContext';

export default function ShortcutsModal({ isOpen, onClose }) {
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if user is typing in an input, textarea or contenteditable element
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.tagName === 'SELECT' || 
                            target.isContentEditable;

            // Shift + ? or Ctrl + / toggles shortcuts cheatsheet modal
            if (((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInput) || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
                e.preventDefault();
                onClose ? onClose(!isOpen) : null;
                return;
            }

            // Close modal with Escape
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                onClose(false);
                return;
            }

            // If user is inside an input, don't trigger navigation / action hotkeys
            if (isInput) return;

            // Alt + T: Toggle Theme (Dark / Light)
            if (e.altKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                toggleTheme();
                return;
            }

            // Alt + D: Dashboard
            if (e.altKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                router.visit(route('admin.dashboard'));
                return;
            }

            // Alt + P: Products list
            if (e.altKey && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                router.visit(route('post.index', { type: 'product' }));
                return;
            }

            // Alt + N: New Product (Create)
            if (e.altKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                router.visit(route('post.create', { type: 'product' }));
                return;
            }

            // Alt + O: Orders
            if (e.altKey && (e.key === 'o' || e.key === 'O')) {
                e.preventDefault();
                router.visit(route('orders'));
                return;
            }

            // Alt + U: Users / Customers
            if (e.altKey && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                router.visit(route('users'));
                return;
            }

            // Alt + S: Settings
            if (e.altKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                router.visit(route('admin.setting', { type: 'site' }));
                return;
            }

            // Alt + C: Categories
            if (e.altKey && (e.key === 'c' || e.key === 'C')) {
                e.preventDefault();
                router.visit(route('taxonomy.index', { type: 'category' }));
                return;
            }

            // Alt + R: Reviews
            if (e.altKey && (e.key === 'r' || e.key === 'R')) {
                e.preventDefault();
                router.visit(route('admin.reviews.index'));
                return;
            }

            // Alt + I: Contact Inquiries
            if (e.altKey && (e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                router.visit(route('admin.contact.index'));
                return;
            }

            // Alt + H: Visit Public Storefront
            if (e.altKey && (e.key === 'h' || e.key === 'H')) {
                e.preventDefault();
                window.open('/', '_blank');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggleTheme]);

    if (!isOpen) return null;

    const shortcutGroups = [
        {
            title: 'Navigation Shortcuts',
            items: [
                { key: 'Alt + D', label: 'Go to Dashboard', icon: <RiDashboardLine className="text-blue-500" /> },
                { key: 'Alt + P', label: 'Products Catalog', icon: <RiShoppingBag3Line className="text-emerald-500" /> },
                { key: 'Alt + N', label: 'Add New Product', icon: <RiAddCircleLine className="text-violet-500" /> },
                { key: 'Alt + C', label: 'Product Categories', icon: <RiAppsLine className="text-amber-500" /> },
                { key: 'Alt + O', label: 'Orders Management', icon: <RiShoppingCart2Line className="text-amber-500" /> },
                { key: 'Alt + U', label: 'Users & Customers', icon: <RiUser3Line className="text-sky-500" /> },
                { key: 'Alt + R', label: 'Customer Reviews', icon: <RiStarLine className="text-yellow-400" /> },
                { key: 'Alt + I', label: 'Contact Inquiries', icon: <RiInboxLine className="text-indigo-400" /> },
                { key: 'Alt + S', label: 'Store Settings', icon: <RiSettings3Line className="text-indigo-500" /> },
            ]
        },
        {
            title: 'Quick Actions & Tools',
            items: [
                { key: 'Ctrl + K', label: 'Global Search Palette', icon: <RiSearchLine className="text-primary" /> },
                { key: 'Alt + T', label: 'Toggle Light / Dark Mode', icon: theme === 'dark' ? <RiSunLine className="text-amber-400" /> : <RiMoonLine className="text-indigo-400" /> },
                { key: 'Alt + H', label: 'Open Storefront in New Tab', icon: <RiHomeLine className="text-teal-500" /> },
                { key: 'Shift + ?', label: 'Keyboard Shortcuts Help', icon: <RiKey2Line className="text-rose-500" /> },
                { key: 'Escape', label: 'Close Active Modal / Popup', icon: <RiCloseLine className="text-res" /> },
            ]
        }
    ];

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => onClose(false)}
        >
            <div 
                className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-permanent/40 bg-accent text-heading shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-permanent/30 px-6 py-4 bg-dynamic/30">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <RiCommandLine size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-heading font-primary">
                                Admin Keyboard Shortcuts
                            </h3>
                            <p className="text-xs text-res">
                                Quick access hotkeys to speed up store management
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onClose(false)}
                        className="rounded-lg p-1.5 text-res hover:bg-dynamic/50 hover:text-heading transition-colors"
                        aria-label="Close"
                    >
                        <RiCloseLine size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                    {shortcutGroups.map((group, idx) => (
                        <div key={idx}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-res mb-3 px-1">
                                {group.title}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {group.items.map((item, itemIdx) => (
                                    <div 
                                        key={itemIdx}
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-permanent/30 bg-bg/50 hover:bg-bg/90 hover:border-primary/40 transition-all"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-lg shrink-0">
                                                {item.icon}
                                            </span>
                                            <span className="text-xs font-medium text-heading truncate">
                                                {item.label}
                                            </span>
                                        </div>
                                        <kbd className="shrink-0 px-2 py-1 text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-md shadow-2xs">
                                            {item.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-permanent/30 px-6 py-3 bg-dynamic/20 text-xs text-res">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-dynamic/70 rounded border border-permanent/40 font-mono text-[10px]">Shift + ?</kbd> anywhere to toggle this panel</span>
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

