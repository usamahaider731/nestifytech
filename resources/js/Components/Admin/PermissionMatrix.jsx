import React from 'react';

const PermissionMatrix = ({ label, name, value = [], rows = [], cols = [], onChange }) => {
    // value is an array of strings like ["product-read", "user-write"]
    const handleToggle = (row, col) => {
        const permission = `${row.toLowerCase()}-${col.toLowerCase()}`;
        const newValue = value.includes(permission)
            ? value.filter(v => v !== permission)
            : [...value, permission];
        onChange(newValue);
    };

    return (
        <div className="w-full bg-accent rounded-xl p-5 border border-border flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex justify-between items-center border-b border-border pb-4">
                <div>
                    <h2 className="text-lg font-black text-heading tracking-tight uppercase leading-none">{label}</h2>
                    <p className="text-res text-[10px] font-bold uppercase mt-1 opacity-70">Access Configuration</p>
                </div>
                <div className="flex gap-1 bg-bg p-1 rounded-lg border border-border">
                    <button type="button" className="text-[9px] font-black uppercase text-primary hover:bg-accent px-2 py-0.5 rounded transition-all">All</button>
                    <button type="button" className="text-[9px] font-black uppercase text-res hover:bg-accent px-2 py-0.5 rounded transition-all">Reset</button>
                </div>
            </div>

            {/* Matrix Body */}
            <div className="flex flex-col">
                {rows.map((row, idx) => (
                    <div key={row} className="flex flex-col md:flex-row gap-4 py-4 border-b border-border last:border-0 transition-all -mx-5 px-5 group items-center">
                        {/* Title & Desc (30%) */}
                        <div className="w-full md:w-1/3">
                            <div className="flex items-center gap-2">
                                <div className="size-1.5 rounded-full bg-primary opacity-30 group-hover:opacity-100 transition-opacity"></div>
                                <h3 className="text-heading font-black text-sm uppercase tracking-tighter">{row}</h3>
                            </div>
                            <p className="text-res text-[10px] font-medium leading-tight mt-1 opacity-60">
                                Global permissions for the {row.toLowerCase()} module.
                            </p>
                        </div>

                        {/* Controls (70%) */}
                        <div className="w-full md:w-2/3 flex items-center">
                            <div className="flex items-center justify-between w-full bg-bg py-2 px-4 rounded-xl border border-border transition-all">
                                <span className="text-res font-bold text-[9px] tracking-widest uppercase opacity-80">Operations</span>
                                <div className="flex gap-2">
                                    {cols.map(col => {
                                        const permission = `${row.toLowerCase()}-${col.toLowerCase()}`;
                                        const isActive = value.includes(permission);
                                        return (
                                            <button
                                                key={col}
                                                type="button"
                                                onClick={() => handleToggle(row, col)}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 border ${
                                                    isActive
                                                        ? 'bg-primary border-primary text-heading shadow-sm'
                                                        : 'bg-accent border-transparent text-res hover:text-heading hover:border-border'
                                                }`}
                                            >
                                                {isActive ? col : `No ${col}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PermissionMatrix;
