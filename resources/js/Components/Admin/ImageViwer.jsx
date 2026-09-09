import React from 'react'
import SvgViewer from './SvgViewer'

function ImageViwer({ image='', className = '' }) {

    const getImageUrl = (img) => {
        if (!img) return '';
        const filename = typeof img === 'string' ? img : img.filename;
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename;
        }
        return `/storage/uploads/image/${filename}`;
    };

    if (typeof image === 'string') {
        return <img src={getImageUrl(image)} className={`${className}`} alt="" />;
    }

    if (image.filename.endsWith('.svg')) {
        return (
            <SvgViewer key={image.filename} src={getImageUrl(image)} className={className} />
        )
    }

    if (image?.filename?.endsWith('.avif') || image?.filename.endsWith('webp')) {
        return (
            <img src={getImageUrl(image)} className={`${className}`} alt="" />
        )
    }

    if (!image.filename.endsWith('.')) {
        if (image.filename.startsWith('http')) return <img src={image.filename} className={`${className}`} alt="" />;
        return (
            <img src={route('thumb.image', { filename: image.filename ?? image.name ?? '', height: '300', width: '300', extension: 'jpg' })} className={`${className}`} alt="" />
        )
    }
    else {
        return <img src={getImageUrl(image)} className={`${className}`} alt="" />
    }
}

export default ImageViwer
