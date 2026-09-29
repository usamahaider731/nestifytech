import { useEffect, useRef, useState } from 'react';

export default function SvgViewer({ width, height, src, key, className = '' }) {
  const [svgContent, setSvgContent] = useState('');
  const svgRef = useRef();

  // Fetch SVG file whenever src changes
  useEffect(() => {
    if (!src) return;
    fetch(src)
      .then(res => res.text())
      .then(setSvgContent)
      .catch(err => console.error('SVG load error:', err));
  }, [src]);

  // Apply styling classes to the SVG element
  useEffect(() => {
    if (svgRef.current) {
      const svgEl = svgRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.classList.add('fill-heading', 'w-full', 'text-primary', 'h-full');
        svgEl.setAttribute('width', width);
      }
    }
  }, [svgContent]);

  return (
    <div
      ref={svgRef}
      key={key}
      width={width}
      height={height}
      className={`svg-viewer ${className} fill-primary`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
