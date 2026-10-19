import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    RiScanLine,
    RiCameraLine,
    RiUpload2Line,
    RiCloseLine,
    RiCheckLine,
    RiAlertLine,
    RiRefreshLine,
    RiIdCardLine,
    RiCalendarLine,
    RiLoader4Line
} from 'react-icons/ri';

/**
 * Loads Tesseract.js dynamically from CDN if not already loaded
 */
const loadTesseractCDN = () => {
    return new Promise((resolve, reject) => {
        if (window.Tesseract) {
            return resolve(window.Tesseract);
        }
        const existingScript = document.getElementById('tesseract-cdn-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.Tesseract));
            existingScript.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.id = 'tesseract-cdn-script';
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.async = true;
        script.onload = () => resolve(window.Tesseract);
        script.onerror = () => reject(new Error('Failed to load OCR library. Please check your internet connection.'));
        document.body.appendChild(script);
    });
};

/**
 * Parse CNIC and Date of Birth from OCR text
 */
export const extractCnicAndDob = (text) => {
    if (!text) return { cnic: null, dob: null, age: null };

    // Standard Pakistani CNIC format: 12345-1234567-1 or without dashes
    let cnic = null;
    const cnicWithDashes = text.match(/\b\d{5}[-\s]?\d{7}[-\s]?\d{1}\b/);
    if (cnicWithDashes) {
        const clean = cnicWithDashes[0].replace(/[\s-]/g, '');
        if (clean.length === 13) {
            cnic = `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12)}`;
        }
    }

    if (!cnic) {
        // Fallback: any 13 contiguous digits
        const raw13 = text.match(/\b\d{13}\b/);
        if (raw13) {
            cnic = `${raw13[0].slice(0, 5)}-${raw13[0].slice(5, 12)}-${raw13[0].slice(12)}`;
        }
    }

    // Date of Birth extraction
    // CNIC formats typically: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
    // Often follows "Date of Birth" or "DOB"
    let dob = null;
    let age = null;

    const dobRegex = /(?:Date\s*of\s*Birth|DOB|Birth\s*Date)?[:\s]*([0-3]?\d)[\.\/\-]([0-1]?\d)[\.\/\-]((?:19|20)\d{2})/i;
    const match = text.match(dobRegex);

    if (match) {
        let day = match[1].padStart(2, '0');
        let month = match[2].padStart(2, '0');
        const year = match[3];

        // Validate basic calendar boundaries
        const dNum = parseInt(day, 10);
        const mNum = parseInt(month, 10);
        const yNum = parseInt(year, 10);

        if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12 && yNum >= 1920 && yNum <= new Date().getFullYear()) {
            dob = `${year}-${month}-${day}`; // standard YYYY-MM-DD input format

            // Calculate age
            const birthDate = new Date(yNum, mNum - 1, dNum);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const mDiff = today.getMonth() - birthDate.getMonth();
            if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            if (calculatedAge >= 0 && calculatedAge <= 130) {
                age = calculatedAge;
            }
        }
    }

    // Fallback: look for generic dates if specific DOB pattern not matched
    if (!dob) {
        const allDates = [...text.matchAll(/\b([0-3]?\d)[\.\/\-]([0-1]?\d)[\.\/\-]((?:19|20)\d{2})\b/g)];
        for (const dMatch of allDates) {
            const d = parseInt(dMatch[1], 10);
            const m = parseInt(dMatch[2], 10);
            const y = parseInt(dMatch[3], 10);
            const currentYear = new Date().getFullYear();
            // DOB is typically older than current expiry dates
            if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1940 && y <= currentYear - 10) {
                dob = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                age = currentYear - y;
                break;
            }
        }
    }

    return { cnic, dob, age };
};

export default function CnicScanner({ onScanComplete, isOpen, onClose }) {
    const [imageSrc, setImageSrc] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [scannedResult, setScannedResult] = useState(null);
    const [error, setError] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);

    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);

    // Stop camera on unmount or close
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setImageSrc(null);
            setScannedResult(null);
            setError(null);
            setProgress(0);
        }
    }, [isOpen, stopCamera]);

    // Start webcam/phone camera
    const startCamera = async () => {
        setError(null);
        setImageSrc(null);
        setScannedResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Could not access camera. Please allow camera permissions or upload an image.');
        }
    };

    // Capture photo from video stream
    const captureFromCamera = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        stopCamera();
        setImageSrc(dataUrl);
        processImage(dataUrl);
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        stopCamera();
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
            processImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Run OCR with Tesseract
    const processImage = async (imgData) => {
        setScanning(true);
        setProgress(5);
        setStatusText('Loading OCR engine...');
        setError(null);
        setScannedResult(null);

        try {
            const Tesseract = await loadTesseractCDN();

            setStatusText('Analyzing CNIC image...');
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(20 + m.progress * 75));
                        setStatusText(`Scanning card (${Math.round(m.progress * 100)}%)...`);
                    }
                },
            });

            const { data } = await worker.recognize(imgData);
            await worker.terminate();

            setProgress(100);
            setStatusText('Parsing details...');

            const parsed = extractCnicAndDob(data.text);

            if (!parsed.cnic && !parsed.dob) {
                setError('Could not clearly read CNIC or Date of Birth. Please ensure good lighting and clear alignment, or try again.');
            } else {
                setScannedResult({
                    ...parsed,
                    rawText: data.text,
                });
            }
        } catch (err) {
            console.error('OCR Error:', err);
            setError(err.message || 'Error processing CNIC image. Please try again.');
        } finally {
            setScanning(false);
        }
    };

    const handleApply = () => {
        if (scannedResult && onScanComplete) {
            onScanComplete({
                cnic: scannedResult.cnic,
                dob: scannedResult.dob,
                age: scannedResult.age,
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-bg border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-subtle/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <RiScanLine size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-text">CNIC & Age Scanner</h3>
                            <p className="text-[11px] text-muted">Scan Pakistani CNIC to auto-detect CNIC Number & DOB</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-hover transition-colors"
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-4">
                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
                            <RiAlertLine size={16} className="shrink-0 mt-0.5" />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {/* Camera Preview Mode */}
                    {cameraActive && (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {/* Card alignment guide overlay */}
                            <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-primary/80 rounded-lg pointer-events-none flex items-center justify-center">
                                <span className="bg-black/50 text-[11px] text-white px-2.5 py-1 rounded-full backdrop-blur-xs">
                                    Align CNIC card inside box
                                </span>
                            </div>

                            <button
                                onClick={captureFromCamera}
                                className="absolute bottom-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full shadow-lg hover:opacity-95 flex items-center gap-1.5 transition-transform active:scale-95"
                            >
                                <RiCameraLine size={15} />
                                Capture Photo
                            </button>
                        </div>
                    )}

                    {/* Image / Scanning State */}
                    {imageSrc && !cameraActive && (
                        <div className="relative rounded-xl overflow-hidden bg-muted/10 border border-border flex items-center justify-center max-h-56">
                            <img src={imageSrc} alt="CNIC preview" className="w-full h-full object-contain max-h-56" />

                            {scanning && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                                    <RiLoader4Line size={28} className="text-primary animate-spin mb-2" />
                                    <p className="text-xs font-medium text-white mb-1.5">{statusText}</p>
                                    <div className="w-48 bg-white/20 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-white/70 mt-1">{progress}%</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action buttons if idle or ready to re-capture */}
                    {!scanning && !cameraActive && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={startCamera}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs font-medium text-text transition-all"
                            >
                                <RiCameraLine size={16} className="text-primary" />
                                {imageSrc ? 'Retake Photo' : 'Use Camera'}
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs font-medium text-text transition-all"
                            >
                                <RiUpload2Line size={16} className="text-primary" />
                                Upload Card Image
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Detected Results Card */}
                    {scannedResult && (
                        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                <RiCheckLine size={16} />
                                Detected Information
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 bg-bg/80 rounded-lg border border-border">
                                    <span className="text-[10px] uppercase font-semibold text-muted flex items-center gap-1 mb-1">
                                        <RiIdCardLine size={12} className="text-primary" />
                                        CNIC Number
                                    </span>
                                    <span className="text-xs font-mono font-bold text-text">
                                        {scannedResult.cnic || <span className="text-rose-500 font-normal italic">Not detected</span>}
                                    </span>
                                </div>

                                <div className="p-2.5 bg-bg/80 rounded-lg border border-border">
                                    <span className="text-[10px] uppercase font-semibold text-muted flex items-center gap-1 mb-1">
                                        <RiCalendarLine size={12} className="text-primary" />
                                        Date of Birth {scannedResult.age !== null && `(Age: ${scannedResult.age})`}
                                    </span>
                                    <span className="text-xs font-bold text-text">
                                        {scannedResult.dob || <span className="text-rose-500 font-normal italic">Not detected</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border bg-subtle/20 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 text-xs font-medium text-muted hover:text-text hover:bg-hover rounded-md transition-colors"
                    >
                        Cancel
                    </button>

                    {scannedResult && (scannedResult.cnic || scannedResult.dob) && (
                        <button
                            type="button"
                            onClick={handleApply}
                            className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:opacity-95 shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                        >
                            <RiCheckLine size={15} />
                            Apply to Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
