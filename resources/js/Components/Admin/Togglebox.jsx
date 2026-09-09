import React from 'react'

function Togglebox({ name, checked, onChange }) {
    return (
        <label className="relative inline-block">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="sr-only peer"
            />
            <div className="peer-checked:bg-primary flex h-7 transition-all duration-300 ease-in-out w-14 rounded-full bg-white"></div>
            <div className="absolute top-1 h-5 w-5 bg-primary transition-all duration-300 ease-in-out peer-checked:bg-white left-1 rounded-full peer-checked:translate-x-7"></div>
        </label>
    )
}

export default Togglebox
