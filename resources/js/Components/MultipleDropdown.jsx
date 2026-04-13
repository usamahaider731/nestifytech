import React, { useEffect, useRef, useState } from 'react';
import TextInput from './TextInput';
import { RiCheckLine, RiExpandUpDownLine } from 'react-icons/ri';
import { input } from '@/Utils/classes';

function MultipleDropdown({
  className = '',
  onChange = () => { },
  placeholder = 'Select Category',
  options = [],
  value = [],
  valueInTitle = false,
  searchable = false,
}) {
  const dropdownRef = useRef();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedValues, setSelectedValues] = useState(() => {
    if (!value || value === '') return [];
    let parsed = Array.isArray(value) ? value : JSON.parse(value);
    return (Array.isArray(parsed) ? parsed : []).map(v => v.toString());
  });

  const [selectedLabels, setSelectedLabels] = useState([]);

  useEffect(() => {
    const labels = [];
    const extractLabels = (opts) => {
      for (const opt of opts) {
        const val = (valueInTitle ? (opt.title ?? opt.name) : opt.id).toString();
        const isSelected = selectedValues.some(v => v.toString() === val);
        if (isSelected) {
          labels.push(opt.title ?? opt.name);
        }
        if (Array.isArray(opt.children)) {
          extractLabels(opt.children);
        }
      }
    };
    extractLabels(options);
    setSelectedLabels(labels);
  }, [selectedValues, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    const val = (valueInTitle ? option.title : option.id).toString();
    if (selectedValues.map(v => v.toString()).includes(val)) {
      const newVals = selectedValues.filter((v) => v.toString() !== val);
      setSelectedValues(newVals);
      onChange(newVals);
    } else {
      const newVals = [...selectedValues, val];
      setSelectedValues(newVals);
      onChange(newVals);
    }
  };

  const filterOptions = (opts) => {
    return opts.reduce((acc, opt) => {
      const title = (opt.title || opt.name || '').toLowerCase();
      const match = title.includes(searchTerm.toLowerCase());
      const filteredChildren = opt.children ? filterOptions(opt.children) : [];

      if (match || filteredChildren.length > 0) {
        acc.push({ ...opt, children: filteredChildren.length > 0 ? filteredChildren : (opt.children ? [] : undefined) });
      }
      return acc;
    }, []);
  };

  const filteredOptions = searchTerm ? filterOptions(options) : options;

  const renderOptions = (opts, level = 1) => {
    return opts.map((opt) => {
      let val = (valueInTitle ? opt.title : opt.id ?? '').toString();
      let isSelected = selectedValues.some(v => (v ?? '').toString() === val);

      return (
        <div key={val} className="w-full flex flex-col gap-1">
          <div style={{ paddingLeft: `${level * 16}px` }}
            onClick={() => handleSelect(opt)}
            className={`h-10 cursor-pointer flex items-center justify-between px-4 rounded text-sm text-heading w-full hover:bg-primary transition-colors ${isSelected ? 'bg-primary font-bold' : ''
              }`}
          >
            <span>{opt.title}</span>
            {isSelected && <RiCheckLine className="h-4 w-4 text-white" />}
          </div>
          {Array.isArray(opt.children) && opt.children.length > 0 && renderOptions(opt.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="w-full h-fit relative group cursor-pointer" onClick={() => setOpen(!open)}>
        <div className={`max-w-full overflow-x-auto h-10 flex items-center gap-2.5 px-3 scroll-hidden group-hover:border-primary transition-all border rounded-lg ${input}`}>
          {
            selectedLabels.length > 0 ? (
              selectedLabels.length > 3 ? (
                <div className='bg-primary h-6 flex items-center justify-center px-3 py-0.5 min-w-max rounded text-[10px] font-black text-heading uppercase tracking-wider shadow-sm'>
                  {selectedLabels.length} Items Selected
                </div>
              ) : (
                selectedLabels.map((val, index) => (
                  <div key={index} className='bg-primary h-6 flex items-center justify-center px-1.5 py-0.5 min-w-max rounded text-[10px] font-normal text-heading'>
                    {val}
                  </div>
                ))
              )
            ) : (
              <span className='text-res'>{placeholder}</span>
            )
          }
        </div>
        <RiExpandUpDownLine className={`absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-secondary ${open ? 'rotate-180' : ''} transition-transform`} />
      </div>

      {open && (
        <div className="absolute left-0 w-full bg-accent dark:bg-gray-800 border border-secondary shadow-2xl z-[999] mt-2 overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-border bg-accent">
              <input
                type="text"
                className="w-full h-9 rounded-lg bg-transparent border border-border px-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Search categories..."
                value={searchTerm}
                autoFocus
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
            {filteredOptions.length > 0 ? (
              renderOptions(filteredOptions)
            ) : (
              <div className="p-10 text-center text-xs text-res italic">
                No matching results found for "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultipleDropdown;