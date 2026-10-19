import React, { useState, useEffect, useRef } from 'react';
import { RiUpload2Fill, RiSparklingLine, RiUserSmileLine } from 'react-icons/ri';

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
    const initializedRef = useRef(false);

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
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
        <label
            className={`flex ${className} items-center flex-col p-4 justify-center border border-secondary min-h-[260px] w-full rounded-[5px] cursor-pointer`}
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
                            className="w-[160px] h-[230px] shadow-[0_0.1875rem_0.75rem_0_rgba(19,17,32,_0.2)] flex-col rounded overflow-hidden"
                        >
                            <div className="w-full h-[140px] border-b border-res p-3 flex items-center justify-center shadow-[0_0.1875rem_0.75rem_0_rgba(19,17,32,_0.2)]">
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
                                    onClick={() => removeFile(index)}
                                    className="text-secondary font-semibold h-full text-xs py-1 hover:underline"
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
                    {autoAvatar && (
                        <button
                            type="button"
                            onClick={handleAutoGenerateAvatar}
                            disabled={generatingAvatar}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            <RiSparklingLine className={`size-3.5 ${generatingAvatar ? 'animate-spin' : ''}`} />
                            {generatingAvatar ? 'Generating Avatar...' : 'Auto-Generate Avatar'}
                        </button>
                    )}
                </div>
            )}
            {autoAvatar && images.length > 0 && (
                <button
                    type="button"
                    onClick={handleAutoGenerateAvatar}
                    disabled={generatingAvatar}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                    <RiSparklingLine className={`size-3.5 ${generatingAvatar ? 'animate-spin' : ''}`} />
                    {generatingAvatar ? 'Generating Avatar...' : 'Generate New Avatar'}
                </button>
            )}
        </label>
    );
});

export default ImageUploader;
