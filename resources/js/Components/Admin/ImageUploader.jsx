import React, { useState, useEffect, useRef } from 'react';
import { 
    RiUpload2Fill, 
    RiSparklingLine, 
    RiUserSmileLine, 
    RiMagicLine, 
    RiCloseLine, 
    RiCheckLine,
    RiRefreshLine,
    RiImageAddLine
} from 'react-icons/ri';

const AI_STYLES = [
    { id: 'photorealistic', name: '📸 Studio Product Shot', promptSuffix: 'professional commercial product photography, studio lighting, crisp focus, 8k uhd, clean isolated background' },
    { id: 'ecommerce', name: '🛍️ Clean E-Commerce White', promptSuffix: 'professional e-commerce product photograph, pure white background, sharp details, commercial catalogue standard' },
    { id: 'lifestyle', name: '🌿 Aesthetic Lifestyle', promptSuffix: 'lifestyle product photography, elegant modern ambient interior, soft natural sunlight, aesthetic depth of field' },
    { id: 'cinematic', name: '🎬 Cinematic & Dramatic', promptSuffix: 'dramatic lighting, cinematic commercial render, high-end luxury brand presentation, sharp textures' },
    { id: 'avatar_bot', name: '🤖 Tech Avatar', promptSuffix: 'vector tech avatar, futuristic aesthetic, sleek clean style' },
    { id: 'avatar_person', name: '👤 Realistic Avatar', promptSuffix: 'professional user profile avatar, friendly warm smile, modern studio lighting' },
];

const SAMPLE_PRODUCT_IDEAS = [
    'Wireless noise cancelling headphones sleek black',
    'Luxury automatic mechanical watch silver',
    'Modern ergonomic running shoes neon accents',
    'Smartwatch with AMOLED display and leather strap',
    'Minimalist ceramic coffee mug pastel tones',
    'High performance gaming laptop RGB keyboard',
];

const ImageUploader = React.memo(function ImageUploader({
    className = '',
    onChange = () => {},
    name = '',
    value = [],
    multiple = false,
    autoAvatar = false,
    avatarSeed = '',
}) {
    const [images, setImages] = useState([]);
    const [generatingAvatar, setGeneratingAvatar] = useState(false);
    const [generatingAiImage, setGeneratingAiImage] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('ecommerce');
    const [aiError, setAiError] = useState(null);
    const initializedRef = useRef(false);

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    };

    // 🤖 AI Neural Image Generator (Pollinations Flux / SDXL High-Def Engine)
    const handleGenerateAiProductImage = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!aiPrompt.trim()) {
            setAiError('Please enter a product description or idea.');
            return;
        }

        setGeneratingAiImage(true);
        setAiError(null);

        try {
            const styleObj = AI_STYLES.find(s => s.id === selectedStyle) || AI_STYLES[1];
            const fullPrompt = `${aiPrompt.trim()}, ${styleObj.promptSuffix}`;
            const seed = Math.floor(Math.random() * 1000000);

            // Direct generative call to high-definition AI engine
            const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=800&height=800&seed=${seed}&nologo=true&enhance=true`;

            const res = await fetch(aiImageUrl);
            if (!res.ok) {
                throw new Error('AI image generation service timed out. Please try again.');
            }

            const blob = await res.blob();
            const safeName = aiPrompt.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'ai-product';
            const file = new File([blob], `${safeName}-${seed}.jpg`, { type: 'image/jpeg' });

            const preview = {
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                isLocal: true,
                file: file,
            };

            const updatedImages = multiple ? [...images, preview] : [preview];
            setImages(updatedImages);
            onChange(multiple ? updatedImages.map(img => img.file).filter(Boolean) : file);

            setShowAiModal(false);
            setAiPrompt('');
        } catch (err) {
            console.error('Failed to generate AI image', err);
            setAiError(err.message || 'Failed to generate AI image.');
        } finally {
            setGeneratingAiImage(false);
        }
    };

    const handleAutoGenerateAvatar = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setGeneratingAvatar(true);
        try {
            const seed = (avatarSeed || 'user_' + Math.floor(Math.random() * 999999)).toString().trim().replace(/\s+/g, '-');
            const styles = ['bottts', 'adventurer', 'avataaars', 'fun-emoji', 'thumbs', 'lorelei'];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

            const res = await fetch(avatarUrl);
            const blob = await res.blob();
            const file = new File([blob], `avatar-${seed}.svg`, { type: 'image/svg+xml' });

            const preview = {
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                isLocal: true,
                file: file,
            };

            const updatedImages = multiple ? [...images, preview] : [preview];
            setImages(updatedImages);
            onChange(multiple ? updatedImages.map(img => img.file).filter(Boolean) : file);
        } catch (err) {
            console.error('Failed to generate avatar', err);
        } finally {
            setGeneratingAvatar(false);
        }
    };

    /* 🔹 Initialize from value (ONLY ONCE) */
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (!value) return;

        const list = Array.isArray(value) ? value : [value];

        const files = list.map((val) => {
            const isString = typeof val === 'string';

            return {
                url: isString
                    ? (val.startsWith('http') ? val : `/storage/uploads/image/${val}`)
                    : URL.createObjectURL(val),
                name: isString ? val : val.name,
                size: isString ? 0 : val.size,
                isLocal: !isString,
                file: isString ? null : val,
            };
        });

        setImages(files);
    }, [value]);

    /* 🔹 Cleanup blobs on unmount */
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.isLocal && img.url.startsWith('blob:')) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, [images]);

    const handleFiles = (files) => {
        if (!files.length) return;

        const newFiles = Array.from(files);

        const previews = newFiles.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            isLocal: true,
            file,
        }));

        const updatedImages = multiple
            ? [...images, ...previews]
            : previews;

        setImages(updatedImages);

        const updatedValue = multiple
            ? updatedImages.map(img => img.file).filter(Boolean)
            : updatedImages[0]?.file || null;
        onChange(updatedValue);
    };

    const removeFile = (index) => {
        const img = images[index];

        if (img?.isLocal && img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
        }

        const updatedImages = images.filter((_, i) => i !== index);

        setImages(updatedImages);

        const updatedValue = multiple
            ? updatedImages.map(img => img.name).filter(Boolean)
            : null;
        onChange(updatedValue);
    };

    return (
        <div className="relative w-full">
            <label
                className={`flex ${className} items-center flex-col p-4 justify-center border border-secondary min-h-[260px] w-full rounded-[5px] cursor-pointer hover:border-primary/60 transition-colors`}
            >
                <input
                    type="file"
                    name={name}
                    accept="image/*"
                    multiple={multiple}
                    hidden
                    onChange={(e) => {
                        if (e.target.files.length) {
                            handleFiles(e.target.files);
                            e.target.value = '';
                        }
                    }}
                />

                {images.length > 0 ? (
                    <div className="w-full flex flex-wrap gap-7">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className="w-[160px] h-[230px] shadow-[0_0.1875rem_0.75rem_0_rgba(19,17,32,_0.2)] flex-col rounded overflow-hidden bg-bg"
                            >
                                <div className="w-full h-[140px] border-b border-res p-3 flex items-center justify-center shadow-[0_0.1875rem_0.75rem_0_rgba(19,17,32,_0.2)] bg-dynamic/10">
                                    <img
                                        src={img.url}
                                        className="max-h-full max-w-full object-contain"
                                        alt={img.name}
                                    />
                                </div>

                                <div className="flex flex-col justify-between h-22.5">
                                    <div className="p-2 flex flex-col gap-1 border-b border-secondary">
                                        <span className="text-res text-xs italic font-medium font-roboto truncate">
                                            {img.name}
                                        </span>
                                        <span className="text-res text-[10px] italic font-roboto">
                                            {formatFileSize(img.size)}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="text-secondary font-semibold h-full text-xs py-1 hover:underline hover:text-rose-500"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 items-center">
                        <span className="w-10 h-11 rounded flex items-center justify-center bg-permanent">
                            <RiUpload2Fill className="size-5 text-res" />
                        </span>
                        <span className="text-xl font-medium text-center text-heading">
                            Drag and drop your image here
                        </span>
                        <span className="text-base -mt-1 font-medium text-res">or</span>
                        <span className="bg-primary/30 text-primary rounded text-sm px-3.5 py-1.5 font-roboto">
                            Browse Images
                        </span>
                    </div>
                )}
            </label>

            {/* 🌟 Floating AI Action Buttons (Product Image & Avatar) */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
                {/* 🎨 AI Product Image Generator Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAiModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer"
                >
                    <RiMagicLine className="size-4 animate-pulse" />
                    <span>Generate Product Image with AI</span>
                </button>

                {/* 👤 Auto Avatar Button */}
                {autoAvatar && (
                    <button
                        type="button"
                        onClick={handleAutoGenerateAvatar}
                        disabled={generatingAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        <RiSparklingLine className={`size-3.5 ${generatingAvatar ? 'animate-spin' : ''}`} />
                        {generatingAvatar ? 'Generating Avatar...' : 'Auto-Generate Avatar'}
                    </button>
                )}
            </div>

            {/* 🔹 Full AI Product Image Generator Modal */}
            {showAiModal && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setShowAiModal(false)}
                >
                    <div 
                        className="bg-bg border border-border/80 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-heading animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/50 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                                    <RiImageAddLine className="size-5" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-heading font-oswald uppercase">
                                        AI Product Image Generator
                                    </h3>
                                    <p className="text-[11px] text-res/70">
                                        Generate high-resolution e-commerce product photos instantly
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="p-1 rounded-lg text-res hover:text-heading hover:bg-dynamic/40"
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-heading uppercase tracking-wider block">
                                Product Description / Prompt
                            </label>
                            <textarea
                                rows={3}
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g. Modern wireless gaming headphones matte black with neon blue LED trim on white background..."
                                className="w-full bg-dynamic/20 border border-border/60 rounded-xl p-3 text-xs text-heading focus:outline-none focus:border-primary resize-none placeholder:text-res/50"
                            />
                        </div>

                        {/* Idea Pills */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-res/70 uppercase tracking-wider block">
                                Quick Product Ideas:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {SAMPLE_PRODUCT_IDEAS.map((idea, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setAiPrompt(idea)}
                                        className="text-[10px] px-2.5 py-1 rounded-full bg-dynamic/30 hover:bg-dynamic/60 border border-border/40 text-res hover:text-heading truncate max-w-[260px] transition-all"
                                    >
                                        "{idea}"
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Style Selector */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-heading uppercase tracking-wider block">
                                Photography & Render Style
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {AI_STYLES.map((st) => (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => setSelectedStyle(st.id)}
                                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                                            selectedStyle === st.id
                                                ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold'
                                                : 'border-border/60 bg-dynamic/10 hover:bg-dynamic/30 text-res'
                                        }`}
                                    >
                                        <div className="font-semibold text-heading text-[11px]">{st.name}</div>
                                        <div className="text-[9px] text-res/70 truncate mt-0.5">{st.promptSuffix.slice(0, 42)}...</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error alert */}
                        {aiError && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                                {aiError}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 rounded-xl border border-border/60 text-xs font-bold text-res hover:text-heading"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateAiProductImage}
                                disabled={generatingAiImage || !aiPrompt.trim()}
                                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-purple-900/30 disabled:opacity-50"
                            >
                                {generatingAiImage ? (
                                    <>
                                        <RiSparklingLine className="size-4 animate-spin" />
                                        <span>AI Rendering Image...</span>
                                    </>
                                ) : (
                                    <>
                                        <RiMagicLine className="size-4" />
                                        <span>Generate & Use Image</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ImageUploader;
