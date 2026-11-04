import { useEffect, useRef, useState } from 'react';

export default function SvgViewer({ width, height, src, className = '' }) {
  const [svgContent, setSvgContent] = useState('');
  const svgRef = useRef();
  useEffect(() => {
    if (!src) return;
    fetch(src)
      .then(res => res.text())
      .then(setSvgContent)
      .catch(err => console.error('SVG load error:', err));
  }, [src]);
  useEffect(() => {
    if (svgRef.current) {
      const svgEl = svgRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.classList.add('w-full', 'h-full');
        svgEl.setAttribute('width', width);
      }
    }
  }, [svgContent]);
  return (
    <div
      ref={svgRef}
      width={width}
      height={height}
      className={`svg-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}