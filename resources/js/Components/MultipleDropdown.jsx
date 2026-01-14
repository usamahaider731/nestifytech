import React, { useEffect, useRef, useState } from 'react';
import TextInput from './TextInput';
import { RiCheckLine, RiExpandUpDownLine } from 'react-icons/ri';
import { input } from '@/Utils/classes';

function MultipleDropdown({
  className = '',
  onChange = () => {},
  placeholder = 'Select Category',
  options = [],
  value = [],
  valueInTitle = false,
}) {
  const dropdownRef = useRef();
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState(value!='' ? ( Array.isArray(value) ? value : (JSON.parse(value))) : []); 
  const [selectedLabels, setSelectedLabels] = useState([]);
  useEffect(() => {
    const labels = [];

    const extractLabels = (opts) => { 
      for (const opt of opts) {
        const val = valueInTitle ? (opt.title ?? opt.name) : opt.id;
        if (selectedValues.includes(val)) {
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

  // Handle click outside dropdown
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
    const val = valueInTitle ? option.title : option.id;
    const label = option.title;

    if (selectedValues.includes(val)) {
      const newVals = selectedValues.filter((v) => v !== val);
      setSelectedValues(newVals);
      onChange(newVals);
    } else {
      const newVals = [...selectedValues, val];
      setSelectedValues(newVals);
      onChange(newVals);
    }
  };

  const renderOptions = (opts, level = 1) => {
    return opts.map((opt) => {
      const val = valueInTitle ? opt.title : opt.id;
      const isSelected = selectedValues.includes(val);

      return (
        <div key={val} className="w-full">
          <div style={{ paddingLeft: `${level * 16}px` }}
            onClick={() => handleSelect(opt)}
            className={`h-10 cursor-pointer flex items-center justify-between px-4 text-sm text-heading w-full hover:bg-primary ${
              isSelected ? 'bg-primary text-white' : ''
            }`}
          >
            <span>{opt.title}</span>
            {isSelected && <RiCheckLine className="h-4 w-4" />}
          </div>
          {Array.isArray(opt.children) && renderOptions(opt.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="w-full h-fit relative" onClick={() => setOpen(!open)}>
        <div className={`max-w-full overflow-x-auto h-10 flex items-center gap-2.5 px-3 scroll-hidden ${input}`}>
          {
            (Array.isArray(selectedLabels) && selectedLabels.length>0)? 
            selectedLabels.map((val, index)=>(
              
              <div key={index} className='bg-primary h-6 flex items-center justify-center px-1.5 py-0.5 min-w-max rounded text-[10px] font-normal text-heading'>{val}</div>
            ))
            :
            <span className='text-res'>
            {placeholder}
            </span>
          }
        </div>
        <RiExpandUpDownLine className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-secondary" />
      </div>

      <div className={`absolute left-0 w-full bg-bg shadow z-50 mt-1 ${open ? 'block' : 'hidden'}`}>
        <div className="max-h-60 overflow-y-auto">
          {renderOptions(options)}
        </div>
      </div>
    </div>
  );
}

export default MultipleDropdown;