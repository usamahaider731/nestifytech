import React, { useEffect, useState } from "react";
import { RiCodeAiLine } from "react-icons/ri";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const DescriptionEditor = ({
    value,
    onChange,
    placeholder = "",
    type = "",
    translate = false,
    id = null,
    field = {},
    data = {},
}) => {
    const [aiAvailable, setAiAvailable] = useState(false);
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!translate || !type) {
            return;
        }

        fetch(route("ai.check.field"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content"),
            },
            body: JSON.stringify({ type, id }),
        })
            .then((res) => res.json())
            .then((res) => {
                setAiAvailable(res.status === "success");
            })
            .catch(() => {
                setAiAvailable(false);
            });
    }, [translate, type, id]);

    const genrateText = () => {
        const requiredFields = field.generate_required || [];
        const requiredFieldsValue = {};
        const emptyFields = [];

        requiredFields.forEach((key) => {
            const fieldValue = data?.[key];
            const isEmpty =
                fieldValue === null ||
                fieldValue === undefined ||
                fieldValue === "" ||
                fieldValue === "[]" ||
                (Array.isArray(fieldValue) && fieldValue.length === 0);

            if (isEmpty) {
                emptyFields.push(key);
            } else {
                requiredFieldsValue[key] = fieldValue;
            }
        });

        if (emptyFields.length > 0) {
            setIsError(true);
            setMessage(`Please fill: ${emptyFields.join(", ")}`);
            return;
        }

        setLoading(true);
        setMessage(null);
        setIsError(false);

        fetch(route("ai.generate.text"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
            body: JSON.stringify({
                type,
                id,
                requiredFieldsValue,
            }),
        })
            .then(async (res) => {
                const payload = await res.json();

                if (!res.ok) {
                    throw new Error(payload?.data || payload?.message || "AI request failed");
                }

                return payload;
            })
            .then((res) => {
                if (res.status === "success" && res.text) {
                    onChange(res.text);
                    setMessage("Description generated successfully.");
                    setIsError(false);
                } else {
                    setIsError(true);
                    setMessage(res.data || "AI generation failed.");
                }
            })
            .catch((error) => {
                setIsError(true);
                setMessage(error.message || "AI generation failed.");
            })
            .finally(() => setLoading(false));
    };

    const modules = {
        toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            [{ align: [] }],
            [{ color: [] }, { background: [] }],
            ["clean"],
        ],
    };

    return (
        <div className="w-full h-70 relative">
            <ReactQuill
                className="h-60 w-full"
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                placeholder={`${placeholder}...`}
            />

            {translate && aiAvailable && (
                <button
                    type="button"
                    onClick={genrateText}
                    disabled={loading}
                    className="size-7 hover:w-24 hover:h-7 overflow-hidden flex items-center group gap-1 duration-300 ease-in-out p-0.75 cursor-pointer bg-primary rounded-full absolute bottom-3 right-4 disabled:opacity-60"
                >
                    <span className="h-full aspect-square rounded-full bg-white/30 flex items-center justify-center">
                        <RiCodeAiLine className="text-white" />
                    </span>
                    <span className="text-white hidden group-hover:block text-sm">
                        {loading ? "..." : "Generate"}
                    </span>
                </button>
            )}

            {message && (
                <p
                    className={`text-sm absolute left-3 bottom-3 ${isError ? "text-red-500" : "text-green-500"
                        }`}
                >
                    {message}
                </p>
            )}

            <input type="hidden" name="description" value={value} />
        </div>
    );
};

export default DescriptionEditor;
