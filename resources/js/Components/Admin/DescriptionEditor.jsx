import React, { useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles

const DescriptionEditor = ({ value, onChange, placeholder='' }) => {
    useEffect(() => {
        // Remove any old MutationObserver or deprecated events
        const observer = new MutationObserver(() => { });
        observer.disconnect();
    }, []);
    const modules = {
        toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            [{ align: [] }],
            [{ color: [] }, { background: [] }],
            ["clean"]
        ],
    };
    return (
        <div className="w-full h-70 text-res fill-heading">
            <ReactQuill className="h-60 w-full"
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                placeholder={`${placeholder} ...`}
            />
            <input type="hidden" name="description" value={value} />
        </div>
    );
};

export default DescriptionEditor;