import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { RiAddLine, RiSubtractLine, RiSearchLine, RiLayoutGridLine, RiInformationLine } from 'react-icons/ri';

/**
 * AttributesSelector
 * Renders a nested repeater: Spec Groups -> Attributes (Key/Value).
 */
const AttributesSelector = ({ value = [], onChange = () => {} }) => {
    const [groups, setGroups] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [openSuggest, setOpenSuggest] = useState(null); // format: { gIdx, aIdx }
    const containerRef = useRef(null);

    /* ── initialise groups from prop ── */
    useEffect(() => {
        if (Array.isArray(value) && value.length > 0) {
            // Support both old flat structure (for migration) and new nested structure
            if (value[0] && value[0].attributes) {
                // Already nested
                setGroups(value.map((g, i) => ({
                    ...g,
                    _id: Date.now() + i,
                    attributes: (g.attributes || []).map((a, j) => ({ ...a, _id: Date.now() + i + j + 1000 }))
                })));
            } else {
                // Flat structure - regroup by group name
                const grouped = {};
                value.forEach((item, i) => {
                    const gName = item.group || 'General';
                    if (!grouped[gName]) grouped[gName] = { group: gName, attributes: [] };
                    grouped[gName].attributes.push({ key: item.key, value: item.value });
                });
                setGroups(Object.values(grouped).map((g, i) => ({
                    ...g,
                    _id: Date.now() + i,
                    attributes: g.attributes.map((a, j) => ({ ...a, _id: Date.now() + i + j + 1000 }))
                })));
            }
        } else {
            // Default empty state
            setGroups([{
                _id: Date.now(),
                group: '',
                attributes: [{ _id: Date.now() + 1, key: '', value: '' }]
            }]);
        }
    }, [value.length === 0]); // Only re-init if value is cleared or initially empty

    /* ── fetch existing attribute names ── */
    useEffect(() => {
        axios.get('/api/attribute-options')
            .then(res => {
                const names = (res.data || []).map(a => a.title);
                setSuggestions(names);
            })
            .catch(() => setSuggestions([]));
    }, []);

    /* ── close dropdown on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpenSuggest(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── helpers ── */
    const emit = (updated) => {
        const clean = updated.map(({ _id, attributes, ...rest }) => ({
            ...rest,
            attributes: attributes.map(({ _id: aId, ...aRest }) => aRest)
        }));
        onChange(clean);
    };

    const addGroup = () => {
        const updated = [...groups, {
            _id: Date.now(),
            group: '',
            attributes: [{ _id: Date.now() + 1, key: '', value: '' }]
        }];
        setGroups(updated);
        emit(updated);
    };

    const removeGroup = (gId) => {
        if (groups.length === 1) {
            const updated = [{ _id: Date.now(), group: '', attributes: [{ _id: Date.now() + 1, key: '', value: '' }] }];
            setGroups(updated);
            emit([]);
            return;
        }
        const updated = groups.filter(g => g._id !== gId);
        setGroups(updated);
        emit(updated);
    };

    const updateGroupField = (gId, field, val) => {
        const updated = groups.map(g => g._id === gId ? { ...g, [field]: val } : g);
        setGroups(updated);
        emit(updated);
    };

    const addAttribute = (gId) => {
        const updated = groups.map(g => g._id === gId ? {
            ...g,
            attributes: [...g.attributes, { _id: Date.now(), key: '', value: '' }]
        } : g);
        setGroups(updated);
        emit(updated);
    };

    const removeAttribute = (gId, aId) => {
        const updated = groups.map(g => g._id === gId ? {
            ...g,
            attributes: g.attributes.filter(a => a._id !== aId)
        } : g);
        setGroups(updated);
        emit(updated);
    };

    const updateAttribute = (gId, aId, field, val) => {
        const updated = groups.map(g => g._id === gId ? {
            ...g,
            attributes: g.attributes.map(a => a._id === aId ? { ...a, [field]: val } : a)
        } : g);
        setGroups(updated);
        emit(updated);
    };

    const filteredSuggestions = (search) =>
        suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={containerRef} className="flex flex-col gap-6 ">
            {groups.map((group, gIdx) => (
                <div key={group._id} className="p-5 rounded-xl border border-secondary bg-accent/20 shadow-sm space-y-4 hover:border-primary/30 transition-colors">
                    {/* Group Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-secondary pb-3 px-1">
                        <div className="flex-1 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                <RiLayoutGridLine className="text-lg" />
                            </div>
                            <input
                                type="text"
                                value={group.group}
                                placeholder="Specification Group (e.g. Battery, Display)"
                                onChange={(e) => updateGroupField(group._id, 'group', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-heading font-bold placeholder:text-res/50 text-base py-0"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeGroup(group._id)}
                            className="w-8 h-8 flex items-center justify-center rounded text-res hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Remove Group"
                        >
                            <RiSubtractLine className="text-xl" />
                        </button>
                    </div>

                    {/* Attributes Repeater */}
                    <div className="space-y-3 pl-4 md:pl-6 border-l-2 border-primary/20 ml-4 py-1">
                        {group.attributes.map((attr, aIdx) => {
                            const filtered = filteredSuggestions(attr.key);
                            const isSuggestOpen = openSuggest?.gIdx === gIdx && openSuggest?.aIdx === aIdx;
                            const showDrop = isSuggestOpen && attr.key.length > 0 && filtered.length > 0;

                            return (
                                <div key={attr._id} className="grid grid-cols-12 gap-3 items-start group/row">
                                    {/* Key input with autocomplete */}
                                    <div className="col-span-12 md:col-span-5 relative">
                                        <div className="relative">
                                            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res text-xs pointer-events-none opacity-60" />
                                            <input
                                                type="text"
                                                value={attr.key}
                                                placeholder="Spec Key (e.g. Resolution)"
                                                onChange={(e) => {
                                                    updateAttribute(group._id, attr._id, 'key', e.target.value);
                                                    setOpenSuggest({ gIdx, aIdx });
                                                }}
                                                onFocus={() => setOpenSuggest({ gIdx, aIdx })}
                                                className="w-full pl-8 pr-3 py-2 text-sm rounded border border-secondary bg-permanent text-heading placeholder:text-res/60 focus:outline-none focus:ring-1 focus:ring-primary h-10"
                                            />
                                        </div>

                                        {/* Autocomplete dropdown */}
                                        {showDrop && (
                                            <ul className="absolute z-50 mt-1 w-full bg-accent border border-secondary rounded-lg shadow-xl max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2">
                                                {filtered.map(name => (
                                                    <li
                                                        key={name}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            updateAttribute(group._id, attr._id, 'key', name);
                                                            setOpenSuggest(null);
                                                        }}
                                                        className="px-4 py-2 text-sm text-heading cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                                                    >
                                                        {name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Value input */}
                                    <div className="col-span-10 md:col-span-6">
                                        <input
                                            type="text"
                                            value={attr.value}
                                            placeholder="Spec Value (e.g. 1080p)"
                                            onChange={(e) => updateAttribute(group._id, attr._id, 'value', e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded border border-secondary bg-permanent text-heading placeholder:text-res/60 focus:outline-none focus:ring-1 focus:ring-primary h-10"
                                        />
                                    </div>

                                    {/* Remove row button */}
                                    <div className="col-span-2 md:col-span-1 flex items-center justify-center pt-1 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => removeAttribute(group._id, attr._id)}
                                            disabled={group.attributes.length === 1}
                                            className="w-8 h-8 flex items-center justify-center rounded text-res hover:bg-red-500/10 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <RiSubtractLine className="text-xl" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Attribute Row button */}
                        <div className="flex pt-1 mt-2">
                            <button
                                type="button"
                                onClick={() => addAttribute(group._id)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all ring-1 ring-primary/20"
                            >
                                <RiAddLine className="text-sm" />
                                Add Attribute
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add Group button */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={addGroup}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-dashed border-secondary text-res hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group/add-g"
                >
                    <RiAddLine className="text-2xl group-hover/add-g:rotate-90 transition-transform duration-300" />
                    <span className="font-bold text-base tracking-wide uppercase">Add Specification Group</span>
                </button>
            </div>

            {/* Helper Info */}
            <div className="p-4 rounded-lg bg-blue-500/5 flex gap-3 border border-blue-500/10 mt-2">
                <RiInformationLine className="text-blue-500 shrink-0 text-lg mt-0.5" />
                <p className="text-sm text-res leading-relaxed">
                    Groups help organize technical specifications into sections like <strong>General</strong>, <strong>Camera</strong>, or <strong>Battery</strong> for better presentation on the product page.
                </p>
            </div>
        </div>
    );
};

export default AttributesSelector;
