import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RiUpload2Fill } from 'react-icons/ri';

const ImageUploader = React.memo(function ImageUploader({
    className = '',
    onChange = () => {},
    name = '',
    value = [],
    multiple = false,
}) {
    const [images, setImages] = useState([]);
    const prevValueRef = useRef(null);
    // Utility to format file sizes
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Load initial value (files or paths)
    useEffect(() => {
        const isSame =
            JSON.stringify(prevValueRef.current) === JSON.stringify(value);
        if (isSame) return;

        prevValueRef.current = value;

        const loadImages = async () => {
            if (Array.isArray(value)) {
                const files = value.map((val) => {
                    const isString = typeof val === 'string';
                    const url = isString
                        ? `/storage/uploads/image/${val}`
                        : URL.createObjectURL(val);
                    const size = isString ? 0 : val.size;

                    return {
                        url,
                        name: isString ? val : val.name,
                        size,
                        isLocal: !isString,
                    };
                });
                setImages(files);
            } else if (value) {
                const isString = typeof value === 'string';
                const url = isString
                    ? `/storage/uploads/image/${value}`
                    : URL.createObjectURL(value);
                const size = isString ? 0 : value.size;
                setImages([
                    {
                        url,
                        name: isString ? value : value.name,
                        size,
                        isLocal: !isString,
                    },
                ]);
            } else {
                setImages([]);
            }
        };

        loadImages();

        // Cleanup created URLs
        return () => {
            images.forEach((img) => {
                if (img.isLocal && img.url.startsWith('blob:')) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, [value]);
    // Handle file input changes
    const handleFiles = (files) => {
        const fileArray = Array.from(files);
        const previews = fileArray.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            isLocal: true,
        }));
        const updatedImages = multiple ? [...images, ...previews] : previews;
        setImages(updatedImages);
        onChange(multiple ? fileArray : fileArray[0]);
    };
    const removeFile = (index) => {
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        if (updated.length === 0) onChange(null);
    };

    return (
        <label
            className={`flex ${className} items-center flex-col p-4 justify-center border border-secondary min-h-[260px] w-full rounded-[5px] cursor-pointer`}
        >
            <input
                type="file"
                accept="image/*"
                multiple={multiple}
                hidden
                onChange={(e) => {
                    if (e.target.files.length) {
                        handleFiles(e.target.files);
                    }
                }}
            />

            {images.length > 0 ? (
                <div className="w-full flex flex-wrap gap-7">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className="w-[180px] h-[230px] shadow-[0_0.1875rem_0.75rem_0_rgba(19,17,32,_0.2)] flex-col rounded overflow-hidden"
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
                    <span className="text-xl font-medium text-heading">
                        Drag and drop your image here
                    </span>
                    <span className="text-base -mt-1 font-medium text-res">or</span>
                    <span className="bg-primary/30 text-primary rounded text-sm px-3.5 py-1.5 font-roboto">
                        Browse Images
                    </span>
                </div>
            )}
        </label>
    );
});

export default ImageUploader;