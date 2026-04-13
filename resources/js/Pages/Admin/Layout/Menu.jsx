import AdminLayout from '@/Layouts/AdminLayout'
import TextInput from '@/Components/TextInput'
import axios from 'axios'
import React, { useMemo, useState } from 'react'
import {
    RiAddLine, RiArrowDownSLine, RiArrowUpSLine,
    RiCheckLine, RiCloseLine, RiDeleteBinLine,
    RiDraggable, RiLinksLine, RiMenuLine,
    RiArrowRightSLine, RiArrowLeftSLine
} from 'react-icons/ri'
import { MdDragIndicator } from 'react-icons/md'
import { toast } from 'react-toastify'
import { useEffect } from 'react'

/* ─────────────────────────────────────────────────────────
   Accordion panel used in the left sidebar
───────────────────────────────────────────────────────── */
function AccordionPanel({ title, icon, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-secondary/20 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-accent hover:bg-accent/80 transition-colors"
            >
                <span className="flex items-center gap-2 text-sm font-semibold text-heading">
                    {icon} {title}
                </span>
                {open ? <RiArrowUpSLine size={16} className="text-res" /> : <RiArrowDownSLine size={16} className="text-res" />}
            </button>
            {open && <div className="p-4 bg-bg border-t border-secondary/10">{children}</div>}
        </div>
    );
}

function MenuItem({ item, depth = 0, onEdit, onRemove, allItems }) {
    const [expanded, setExpanded] = useState(false);
    const [name, setName] = useState(item.name);
    const [link, setLink] = useState(item.link ?? '');
    const [saving, setSaving] = useState(false);

    const children = allItems.filter(m => m.parent_id == item.id);

    const save = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', name);
            fd.append('link', link);
            fd.append('location', item.location);
            fd.append('parent', item.parent_id ?? 0);
            const res = await axios.post(route('menu.update', { id: item.id }), fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onEdit(res.data);
            setExpanded(false);
            toast.success('Saved!');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={depth > 0 ? 'ml-8 mt-2' : 'mt-2'}>
            <div
                className={`
                    border rounded-lg transition-all duration-150
                    ${expanded
                        ? 'border-primary/40 shadow-sm shadow-primary/10'
                        : 'border-secondary/20 hover:border-secondary/40'
                    }
                    bg-accent
                `}
            >
                <div className="flex items-center gap-2 px-3 py-2.5">
                    <MdDragIndicator
                        size={18}
                        className="text-secondary/40 cursor-grab shrink-0"
                        title="Drag to reorder"
                    />
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-heading truncate block">{item.name}</span>
                        {!expanded && (
                            <span className="text-[11px] text-res opacity-50 truncate block">{item.link}</span>
                        )}
                    </div>
                    {depth > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                            Sub item
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setExpanded(e => !e)}
                        className="p-1 text-res hover:text-primary transition-colors shrink-0"
                        title={expanded ? 'Collapse' : 'Edit'}
                    >
                        {expanded
                            ? <RiArrowUpSLine size={16} />
                            : <RiArrowDownSLine size={16} />
                        }
                    </button>
                </div>

                {/* ── Inline edit panel ── */}
                {expanded && (
                    <div className="border-t border-secondary/10 px-4 py-4 bg-bg/50">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-res opacity-60">
                                    Navigation Label
                                </label>
                                <TextInput
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-res opacity-60">
                                    URL
                                </label>
                                <TextInput
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                    className="h-9 text-sm"
                                    placeholder="https://"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="text-[12px] text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <RiDeleteBinLine size={13} /> Remove
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setExpanded(false); setName(item.name); setLink(item.link ?? ''); }}
                                    className="text-[12px] text-res hover:text-heading transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={save}
                                    disabled={saving}
                                    className="text-[12px] bg-primary text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                >
                                    <RiCheckLine size={13} />
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Render children recursively ── */}
            {children.map(child => (
                <MenuItem
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    allItems={allItems}
                    onEdit={onEdit}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   Main Menu page
───────────────────────────────────────────────────────── */
function Menu({ menu, menu_options }) {
    const [allMenus, setAllMenus] = useState(Array.isArray(menu) ? menu : []);

    // ── Custom-link form state ──
    const [customUrl, setCustomUrl] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customParent, setCustomParent] = useState(0);
    const [addingLink, setAddingLink] = useState(false);

    // ── Custom locations state ──
    const [customLocations, setCustomLocations] = useState([]);
    const [newLocName, setNewLocName] = useState('');

    // ── Location tabs ──
    const locations = useMemo(() => {
        const fromDb = [...new Set(allMenus.map(m => m.location).filter(Boolean))];
        const defaults = ['header', 'footer', 'services'];
        return [...new Set([...fromDb, ...defaults, ...customLocations])];
    }, [allMenus, customLocations]);

    const [activeLocation, setActiveLocation] = useState(
        () => [...new Set(menu?.map(m => m.location).filter(Boolean))][0] ?? 'header'
    );

    // ── Predefined items (Categories, Brands, Products) ──
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);
    
    // Checked state for bulk addition
    const [checkedCategories, setCheckedCategories] = useState([]);
    const [checkedBrands, setCheckedBrands] = useState([]);
    const [checkedProducts, setCheckedProducts] = useState([]);
    const [addingBulk, setAddingBulk] = useState(false);

    useEffect(() => {
        // Fetch taxonomies and products
        axios.get('/api/get_taxonomies?type=category').then(res => setCategories(res.data)).catch(() => {});
        axios.get('/api/get_taxonomies?type=brand').then(res => setBrands(res.data)).catch(() => {});
        axios.get('/api/get_posts?type=product').then(res => setProducts(res.data)).catch(() => {});
    }, []);

    // Helper to toggle bulk selections
    const toggleCheck = (id, list, setList) => {
        setList(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const handleAddBulkItems = async (type, items, checkedIds, setCheckedIds, makeLink) => {
        if (checkedIds.length === 0) return;
        setAddingBulk(true);
        const r = toast.loading(`Adding ${type}s…`);
        
        try {
            const selectedItems = items.filter(i => checkedIds.includes(i.id));
            let newMenus = [];
            
            // We sequentially post them to reuse the same endpoint
            for (const item of selectedItems) {
                const fd = new FormData();
                fd.append('name', item.title || item.name);
                fd.append('link', makeLink(item));
                fd.append('parent', 0);
                fd.append('location', activeLocation);
                
                const res = await axios.post(route('menu.submit'), fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newMenus.push(res.data);
            }
            
            setAllMenus(prev => [...prev, ...newMenus]);
            setCheckedIds([]); // clear selection
            toast.dismiss(r);
            toast.success(`Added ${newMenus.length} items to menu!`);
        } catch {
            toast.dismiss(r);
            toast.error('Failed to add some items');
        } finally {
            setAddingBulk(false);
        }
    };

    // Items for the active location (root items only — children rendered recursively)
    const locationItems = useMemo(
        () => allMenus.filter(m => m.location === activeLocation),
        [allMenus, activeLocation]
    );
    const rootItems = locationItems.filter(m => !m.parent_id || m.parent_id == 0);

    // ── Handlers ──
    const handleAddLocation = () => {
        const slug = newLocName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!slug) return;
        if (locations.includes(slug)) {
            toast.error('Location already exists.');
            return;
        }
        setCustomLocations(prev => [...prev, slug]);
        setActiveLocation(slug);
        setNewLocName('');
        toast.success(`Location '${slug}' added!`);
    };

    const handleRemoveLocation = async () => {
        if (!confirm(`Are you sure you want to completely delete the "${activeLocation}" location and ALL its menu items?`)) {
            return;
        }

        const itemsToDelete = allMenus.filter(m => m.location === activeLocation && (!m.parent_id || m.parent_id == 0));
        
        if (itemsToDelete.length > 0) {
            const r = toast.loading('Deleting location items…');
            try {
                // Delete root items (children cascade via backend)
                await Promise.all(itemsToDelete.map(m => axios.delete(route('menu.destroy', { id: m.id }))));
                setAllMenus(prev => prev.filter(m => m.location !== activeLocation));
                toast.dismiss(r);
                toast.success('Location items deleted.');
            } catch {
                toast.dismiss(r);
                toast.error('Failed to delete some items. Try again.');
                return;
            }
        }

        setCustomLocations(prev => prev.filter(l => l !== activeLocation));
        const remaining = locations.filter(l => l !== activeLocation);
        setActiveLocation(remaining[0] || 'header');
    };

    const handleEdit = (updated) => {
        setAllMenus(prev => prev.map(m => m.id === updated.id ? updated : m));
    };

    const handleRemove = async (id) => {
        const r = toast.loading('Removing…');
        try {
            await axios.delete(route('menu.destroy', { id }));
            setAllMenus(prev => prev.filter(m => m.id !== id && m.parent_id !== id));
            toast.dismiss(r);
            toast.success('Removed!');
        } catch {
            toast.dismiss(r);
            toast.error('Failed to remove');
        }
    };

    const handleAddCustomLink = async () => {
        if (!customLabel.trim()) { toast.error('Label is required'); return; }
        setAddingLink(true);
        const r = toast.loading('Adding…');
        try {
            const fd = new FormData();
            fd.append('name', customLabel);
            fd.append('link', customUrl || '#');
            fd.append('parent', customParent);
            fd.append('location', activeLocation);
            const res = await axios.post(route('menu.submit'), fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAllMenus(prev => [...prev, res.data]);
            setCustomUrl('');
            setCustomLabel('');
            setCustomParent(0);
            toast.dismiss(r);
            toast.success('Added to menu!');
        } catch {
            toast.dismiss(r);
            toast.error('Failed to add');
        } finally {
            setAddingLink(false);
        }
    };

    // Parent options for the location being edited
    const parentOptions = locationItems.filter(m => !m.parent_id || m.parent_id == 0);

    return (
        <div className="py-5 px-6">
            {/* ── Page title ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-heading font-roboto">Menus</h1>
                <p className="text-sm text-res mt-1">Create and manage navigation menus for your site.</p>
            </div>

            <div className="flex gap-6 items-start">

                {/* ═══════════════════════════════════════════
                    LEFT: Add items
                ═══════════════════════════════════════════ */}
                <div className="w-72 shrink-0 flex flex-col gap-3">

                    {/* Custom Links */}
                    <AccordionPanel
                        title="Custom Links"
                        icon={<RiLinksLine size={15} />}
                        defaultOpen={true}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-res opacity-70">URL</label>
                                <TextInput
                                    value={customUrl}
                                    onChange={e => setCustomUrl(e.target.value)}
                                    placeholder="https://"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-res opacity-70">Link Text</label>
                                <TextInput
                                    value={customLabel}
                                    onChange={e => setCustomLabel(e.target.value)}
                                    placeholder="Menu item name"
                                    className="h-9 text-sm"
                                />
                            </div>
                            {/* Parent selector */}
                            {parentOptions.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-res opacity-70">Parent (optional)</label>
                                    <select
                                        value={customParent}
                                        onChange={e => setCustomParent(parseInt(e.target.value))}
                                        className="h-9 px-3 rounded-lg bg-accent border border-secondary/20 text-res text-sm w-full"
                                    >
                                        <option value={0}>None (top level)</option>
                                        {parentOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleAddCustomLink}
                                disabled={addingLink}
                                className="w-full h-9 bg-primary text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-md shadow-primary/20 mt-1"
                            >
                                <RiAddLine size={16} />
                                Add to Menu
                            </button>
                        </div>
                    </AccordionPanel>

                    {/* Predefined Categories */}
                    <AccordionPanel title="Categories" icon={<RiMenuLine size={15} />} defaultOpen={false}>
                        <div className="max-h-48 overflow-y-auto mb-3 flex flex-col gap-1.5 p-1">
                            {categories.length === 0 ? <span className="text-xs text-res opacity-60">No categories found.</span> :
                             categories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-2 text-sm text-heading cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={checkedCategories.includes(cat.id)}
                                        onChange={() => toggleCheck(cat.id, checkedCategories, setCheckedCategories)}
                                        className="rounded border-secondary/30 text-primary focus:ring-primary bg-bg"
                                    />
                                    {cat.title}
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAddBulkItems('Category', categories, checkedCategories, setCheckedCategories, c => `/category/${c.id}`)}
                            disabled={addingBulk || checkedCategories.length === 0}
                            className="w-full h-8 bg-secondary/10 text-primary border border-secondary/20 text-xs font-semibold rounded flex items-center justify-center gap-1.5 hover:bg-secondary/20 disabled:opacity-50 transition-colors"
                        >
                            <RiAddLine size={14} /> Add Selected
                        </button>
                    </AccordionPanel>

                    {/* Predefined Brands */}
                    <AccordionPanel title="Brands" icon={<RiMenuLine size={15} />} defaultOpen={false}>
                        <div className="max-h-48 overflow-y-auto mb-3 flex flex-col gap-1.5 p-1">
                            {brands.length === 0 ? <span className="text-xs text-res opacity-60">No brands found.</span> :
                             brands.map(brand => (
                                <label key={brand.id} className="flex items-center gap-2 text-sm text-heading cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={checkedBrands.includes(brand.id)}
                                        onChange={() => toggleCheck(brand.id, checkedBrands, setCheckedBrands)}
                                        className="rounded border-secondary/30 text-primary focus:ring-primary bg-bg"
                                    />
                                    {brand.title}
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAddBulkItems('Brand', brands, checkedBrands, setCheckedBrands, b => `/brand/${b.id}`)}
                            disabled={addingBulk || checkedBrands.length === 0}
                            className="w-full h-8 bg-secondary/10 text-primary border border-secondary/20 text-xs font-semibold rounded flex items-center justify-center gap-1.5 hover:bg-secondary/20 disabled:opacity-50 transition-colors"
                        >
                            <RiAddLine size={14} /> Add Selected
                        </button>
                    </AccordionPanel>

                    {/* Predefined Products */}
                    <AccordionPanel title="Products" icon={<RiMenuLine size={15} />} defaultOpen={false}>
                        <div className="max-h-48 overflow-y-auto mb-3 flex flex-col gap-1.5 p-1">
                            {products.length === 0 ? <span className="text-xs text-res opacity-60">No products found.</span> :
                             products.map(prod => (
                                <label key={prod.id} className="flex items-center gap-2 text-sm text-heading cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={checkedProducts.includes(prod.id)}
                                        onChange={() => toggleCheck(prod.id, checkedProducts, setCheckedProducts)}
                                        className="rounded border-secondary/30 text-primary focus:ring-primary bg-bg"
                                    />
                                    <span className="truncate">{prod.title}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAddBulkItems('Product', products, checkedProducts, setCheckedProducts, p => `/product/${p.slug || p.id}`)}
                            disabled={addingBulk || checkedProducts.length === 0}
                            className="w-full h-8 bg-secondary/10 text-primary border border-secondary/20 text-xs font-semibold rounded flex items-center justify-center gap-1.5 hover:bg-secondary/20 disabled:opacity-50 transition-colors"
                        >
                            <RiAddLine size={14} /> Add Selected
                        </button>
                    </AccordionPanel>

                    {/* Manage Locations */}
                    <AccordionPanel
                        title="Manage Locations"
                        icon={<RiMenuLine size={15} />}
                        defaultOpen={false}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1 text-res text-sm">
                                <p className="leading-tight opacity-70">Create a new menu location tab.</p>
                                <TextInput
                                    value={newLocName}
                                    onChange={e => setNewLocName(e.target.value)}
                                    placeholder="e.g. sidebar-menu"
                                    className="h-9 text-sm mt-1"
                                    onKeyDown={e => e.key === 'Enter' && handleAddLocation()}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddLocation}
                                className="w-full h-9 bg-accent border border-primary text-primary text-sm font-semibold rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                            >
                                <RiAddLine size={16} />
                                Add Location
                            </button>
                        </div>
                    </AccordionPanel>

                    {/* Location info card */}
                    <div className="border border-primary/20 bg-primary/5 rounded-lg p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-primary mb-2">Active Location</p>
                        <p className="text-sm font-semibold text-heading capitalize">{activeLocation}</p>
                        <p className="text-[11px] text-res opacity-60 mt-1">
                            Items added will appear in the <span className="font-bold capitalize">{activeLocation}</span> navigation slot.
                        </p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    RIGHT: Menu structure
                ═══════════════════════════════════════════ */}
                <div className="flex-1 min-w-0">
                    <div className="border border-secondary/20 rounded-xl overflow-hidden bg-accent">

                        {/* ── Location tabs ── */}
                        <div className="flex border-b border-secondary/10 bg-bg/30 overflow-x-auto">
                            {locations.map(loc => {
                                const count = allMenus.filter(m => m.location === loc).length;
                                return (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => setActiveLocation(loc)}
                                        className={`
                                            flex items-center gap-2 px-5 py-3.5 text-sm font-medium
                                            capitalize whitespace-nowrap border-b-2 -mb-px transition-all duration-200
                                            ${activeLocation === loc
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-res hover:text-heading hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {loc}
                                        <span className={`
                                            text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center
                                            ${activeLocation === loc
                                                ? 'bg-primary text-white'
                                                : count > 0 ? 'bg-secondary/20 text-res' : 'opacity-0'
                                            }
                                        `}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Menu structure builder ── */}
                        <div className="p-5">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-heading capitalize flex items-center gap-3">
                                        {activeLocation} Menu
                                        <button
                                            type="button"
                                            onClick={handleRemoveLocation}
                                            className="text-[11px] font-normal text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                                        >
                                            <RiDeleteBinLine size={12} /> Delete Menu
                                        </button>
                                    </h3>
                                    <p className="text-[11px] text-res opacity-60 mt-0.5">
                                        Drag items to reorder. Click the arrow to edit.
                                    </p>
                                </div>
                                <span className="text-[11px] text-res opacity-50 bg-accent px-2.5 py-1 rounded-full border border-secondary/20">
                                    {rootItems.length} item{rootItems.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Items list */}
                            {rootItems.length === 0 ? (
                                <div className="py-14 text-center border-2 border-dashed border-secondary/15 rounded-xl">
                                    <RiMenuLine size={36} className="mx-auto text-secondary/30 mb-3" />
                                    <p className="text-sm text-res opacity-50">No items in this menu yet.</p>
                                    <p className="text-[11px] text-res opacity-30 mt-1">
                                        Add items using the Custom Links panel on the left.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {rootItems.map(item => (
                                        <MenuItem
                                            key={item.id}
                                            item={item}
                                            depth={0}
                                            allItems={locationItems}
                                            onEdit={handleEdit}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Menu locations footer ── */}
                        <div className="border-t border-secondary/10 px-5 py-4 bg-bg/20">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-res opacity-50 mb-2">
                                Menu Locations
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {locations.map(loc => (
                                    <span
                                        key={loc}
                                        className={`
                                            text-[11px] px-3 py-1 rounded-full border font-medium capitalize cursor-pointer transition-all
                                            ${activeLocation === loc
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : 'bg-accent border-secondary/20 text-res hover:border-primary/20'
                                            }
                                        `}
                                        onClick={() => setActiveLocation(loc)}
                                    >
                                        {loc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Menu;
Menu.layout = (view) => <AdminLayout>{view}</AdminLayout>;