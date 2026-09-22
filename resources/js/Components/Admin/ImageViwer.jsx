import React from 'react'
import SvgViewer from './SvgViewer'

function ImageViwer({ image='', className = '', width=300, height=300 }) {

    const getImageUrl = (img) => {
        if (!img) return '';
        const filename = typeof img === 'string' ? img : img.filename;
        if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/')) {
            return filename;
        }
        return `/storage/uploads/image/${filename}`;
    };

    if (typeof image === 'string' && image.includes('.')) {
        return <img src={getImageUrl(image)} className={`${className}`} alt="" />;
    }
    if (typeof image === 'string' && !image.includes('.')) {
       return(
            <img src={route('thumb.image', { filename: image ?? '', height: height, width: width, extension: 'jpg' })} className={`${className}`} alt="" />
       )
    }

    if (image.filename.endsWith('.svg')) {
        return (
            <SvgViewer key={image.filename} width={width} height={height} src={getImageUrl(image)} className={className} />
        )
    }

    if (image?.filename?.endsWith('.avif')) {
        return (
            <img src={getImageUrl(image)} className={`${className}`} alt="" />
        )
    }

    if (!image.filename.endsWith('.') || image.name) {
    
        const ext = image.filename.split('.').pop();

        console.log(image)
        if (image.filename.startsWith('http')) return <img src={image.filename} className={`${className}`} alt="" />;
        return (
            <img src={route('thumb.image', { filename: image.filename ?? image.name ?? '', height: height, width: width, extension: ext })} className={`${className}`} alt="" />
        )
    }
    else {
        
        return <img src={getImageUrl(image)} className={`${className}`} alt="" />
    }
}

export default ImageViwer
