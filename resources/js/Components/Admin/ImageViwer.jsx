import React, { useState } from 'react';
import SvgViewer from './SvgViewer';

const DEFAULT_FALLBACK_IMAGE = '/assets/image/placeholder.svg';

function ImageViwer({
    image = '',
    className = '',
    width = 300,
    height = 300,
    fallback = DEFAULT_FALLBACK_IMAGE,
    alt = '',
    ...props
}) {
    const [hasError, setHasError] = useState(false);

    const getImageUrl = (img) => {
        if (!img) return fallback;
        const filename = typeof img === 'string' ? img : (img?.filename || img?.name || '');
        if (!filename) return fallback;

        if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/')) {
            return filename;
        }
        return `/storage/uploads/image/${filename}`;
    };

    const handleError = (e) => {
        if (!hasError) {
            setHasError(true);
            if (e?.target) {
                e.target.src = fallback;
            }
        }
        if (typeof props.onError === 'function') {
            props.onError(e);
        }
    };

    // If already errored out, render fallback image directly
    if (hasError || !image) {
        return (
            <img
                src={fallback}
                className={className}
                alt={alt || 'Fallback image'}
                width={width}
                height={height}
                {...props}
            />
        );
    }

    const filename = typeof image === 'string' ? image : (image?.filename || image?.name || '');

    // SVG Handling
    if (filename.endsWith('.svg')) {
        return (
            <SvgViewer
                key={filename}
                width={width}
                height={height}
                src={getImageUrl(image)}
                className={className}
                {...props}
            />
        );
    }

    // String with extension
    if (typeof image === 'string' && image.includes('.')) {
        return (
            <img
                src={getImageUrl(image)}
                className={className}
                alt={alt}
                onError={handleError}
                {...props}
            />
        );
    }

    // String without extension — try direct storage path with common extensions via onError chain
    if (typeof image === 'string' && !image.includes('.')) {
        return (
            <img
                src={`/storage/uploads/image/${image}.webp`}
                className={className}
                alt={alt}
                onError={(e) => {
                    // Try jpg fallback, then placeholder
                    if (e.target.src.endsWith('.webp')) {
                        e.target.src = `/storage/uploads/image/${image}.jpg`;
                    } else if (e.target.src.endsWith('.jpg')) {
                        e.target.src = `/storage/uploads/image/${image}.png`;
                    } else {
                        handleError(e);
                    }
                }}
                {...props}
            />
        );
    }

    // AVIF
    if (image?.filename?.endsWith('.avif')) {
        return (
            <img
                src={getImageUrl(image)}
                className={className}
                alt={alt}
                onError={handleError}
                {...props}
            />
        );
    }

    // Object with filename/name
    if (image?.filename || image?.name) {
        const file = image.filename || image.name;

        if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('/')) {
            return (
                <img
                    src={file}
                    className={className}
                    alt={alt}
                    onError={handleError}
                    {...props}
                />
            );
        }

        // Use direct storage URL to avoid route regex ambiguity with filenames
        // that contain underscores and dots (e.g. 1786225579_abc_500x500.webp)
        return (
            <img
                src={`/storage/uploads/image/${file}`}
                className={className}
                alt={alt}
                onError={handleError}
                {...props}
            />
        );
    }

    return (
        <img
            src={getImageUrl(image)}
            className={className}
            alt={alt}
            onError={handleError}
            {...props}
        />
    );
}

export default ImageViwer;
