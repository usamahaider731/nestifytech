import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useLang } from '@/contexts/LanguageContext';
import { RiDownload2Line, RiQrCodeLine, RiCloseLine } from 'react-icons/ri';

const ProductQRCode = ({ product }) => {
    const { __ } = useLang();
    const [open, setOpen] = useState(false);
    const canvasRef = useRef(null);

    const productUrl = route('post', {
        sku: product.sku,
        id: product.id,
        type: 'product',
    });

    const handleDownload = () => {
        const canvas = canvasRef.current?.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${product.sku}-qr.png`;
        link.click();
    };

    return (
        <>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                title={__('Show QR Code')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border-2 border-primary text-primary rounded hover:bg-primary hover:text-white transition-all duration-200"
            >
                <RiQrCodeLine className="size-4" />
                {__('QR Code')}
            </button>

            {/* Modal */}
            {open && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative bg-white shadow-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute cursor-pointer top-3 right-3 text-res hover:text-heading transition-colors"
                        >
                            <RiCloseLine className="size-5" />
                        </button>

                        <div className="flex flex-col items-center gap-1 text-center">
                            <RiQrCodeLine className="text-3xl text-primary" />
                            <h3 className="text-base font-bold text-heading font-poppins">
                                {__('Scan to View Product')}
                            </h3>
                            <p className="text-xs text-res max-w-[200px]">
                                {product.title}
                            </p>
                        </div>

                        {/* QR code */}
                        <div
                            ref={canvasRef}
                            className="p-3 border border-border bg-white shadow-inner"
                        >
                            <QRCodeCanvas
                                value={productUrl}
                                size={180}
                                bgColor="#ffffff"
                                fgColor="#1a1a1a"
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        <p className="text-[10px] text-res break-all text-center max-w-[220px]">
                            {productUrl}
                        </p>

                        {/* Download button */}
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                        >
                            <RiDownload2Line className="size-4" />
                            {__('Download PNG')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductQRCode;
