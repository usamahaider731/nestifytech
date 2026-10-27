import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import ImageViwer from '../Admin/ImageViwer';
const AdsRender = ({ type = 'sidebar', placement = 'product_sidebar', className='' }) => {
    const { setting } = usePage().props;
    const ads = setting?.ads?.items.value ?? [];
    const ad = ads.find((a) => a.placement === placement && (a.active !== false && a.active !== '0' && a.active !== 0));

    if (!ad) {
        return null;
    }

    const renderIframe = () => {
        if (!ad.iframe) return null;
        const trimmed = ad.iframe.trim();
        // If user pasted a full <iframe ...> tag
        if (trimmed.startsWith('<iframe')) {
            return (
                <div
                    className="w-full h-full overflow-hidden [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                    dangerouslySetInnerHTML={{ __html: trimmed }}
                />
            );
        }
        // Otherwise treat as an embed URL
        return (
            <iframe
                src={trimmed}
                title={ad.title || 'Advertisement'}
                className="w-full min-h-[250px] md:min-h-[350px] border-0 rounded"
                allowFullScreen
                loading="lazy"
            />
        );
    };

    const content = (
        <>
            {ad.ad_type === 'image' && ad.image && (
                <ImageViwer image={ad.image} className="w-full max-h-full object-cover" alt={ad.title || 'Advertisement'} />
            )}
            {ad.ad_type === 'iframe' && renderIframe()}
            {ad.ad_type === 'html' && ad.html && (
                <div dangerouslySetInnerHTML={{ __html: ad.html }} />
            )}
        </>
    );

    // If ad is an iframe, do not wrap in an anchor tag so user can interact with the iframe content directly
    if (ad.ad_type !== 'iframe' && ad.link) {
        const isExternal = ad.link.startsWith('http://') || ad.link.startsWith('https://');
        if (isExternal || ad.open_new_tab) {
            return (
                <a
                    href={ad.link}
                    target={ad.open_new_tab ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className={`block ${className}`}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link href={ad.link} className={`block ${className}`}>
                {content}
            </Link>
        );
    }

    return (
        <div className={`block ${className}`}>
            {content}
        </div>
    );
};

export default AdsRender;
