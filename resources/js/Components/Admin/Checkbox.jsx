import { RiCheckFill } from "react-icons/ri";

export default function Checkbox({ className = '', onChange='', ...props }) {
    return (
        <>
            <label className="relative size-4.5 cursor-pointer">
                <input
                onChange={onChange}
                    {...props}

                    type="checkbox"
                    className={
                        'border-0 outline-0 hidden peer focus:ring-0 appearance-none px-3 py-2 rounded-full ' 
                        
                    }
                    value={1}
                />
                <div className={`peer-checked:bg-primary flex h-4.5 transition-all duration-300 ease-in-out w-4.5 rounded border-2 bg-transparent border-primary ${className}`}></div>
                <RiCheckFill className="absolute top-1/2 h-3.5 w-3.5 transition-all duration-300 ease-in-out peer-checked:text-white text-transparent left-1/2 -translate-1/2" />
            </label>
        </>
    );
}
