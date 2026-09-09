import React, { useState } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

// Extend colord with the color names plugin to recognize words like "gray", "slate", etc.
extend([namesPlugin]);

const LocalColorConverter = () => {
  const [inputText, setInputText] = useState('');
  const [resolvedColor, setResolvedColor] = useState({ name: 'Default', code: '#ffffff' });

  const handleChange = (e) => {
    const query = e.target.value;
    setInputText(query);

    if (!query.trim()) {
      setResolvedColor({ name: '', code: '#ffffff' });
      return;
    }

    // Check if colord recognizes the color name or hex directly
    const parsedColor = colord(query.toLowerCase().trim());

    if (parsedColor.isValid()) {
      setResolvedColor({
        name: query,
        code: parsedColor.toHex()
      });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', fontFamily: 'sans-serif' }}>
      <h3>Instant Color Code Converter</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={inputText}
          onChange={handleChange}
          placeholder="Type a color name (e.g. gray, slate, teal)..."
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>

      {/* Dynamic Preview Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          backgroundColor: '#f9f9f9'
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            backgroundColor: resolvedColor.code,
            borderRadius: '4px',
            marginRight: '15px',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
        <div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>{resolvedColor.name || 'Color Name'}</div>
          <code style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
            {resolvedColor.code}
          </code>
        </div>
      </div>
    </div>
  );
};

export default LocalColorConverter;