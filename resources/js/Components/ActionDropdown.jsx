import { Transition, TransitionChild } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import React, { createContext, useContext, useState } from 'react'
const AttributeDropDownContext = createContext();

function ActionDropdown({ children }) {
    const [Open, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };
    return (

        <AttributeDropDownContext.Provider value={{ Open, setOpen, toggleOpen }}>
            <div className='relative w-fit h-fit'>
                {children}
            </div>
        </AttributeDropDownContext.Provider>
    )
}
function Trigger({ children }) {
    const { Open, setOpen, toggleOpen } = useContext(AttributeDropDownContext);
    return (
        <>
            <div onClick={toggleOpen} className={`relative h-7 rounded-full flex items-center justify-center hover:bg-dynamic w-7  ${Open && 'bg-dynamic'}`}>
                {children}
            </div>
            {Open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </>
    )
}
function Context({ children, className }) {
    const { Open, setOpen, toggleOpen } = useContext(AttributeDropDownContext);
    return (
        <Transition show={Open} onClick={toggleOpen}>
            <div className={`${className} absolute top-9 w-36 z-50 right-0 bg-accent rounded-md p-2 font-medium text-sm text-heading shadow-3xl`}>
                {children}
            </div>
        </Transition>
    )
}
function List({ children, className, ...props }) {
    return (
        <div {...props} className={`${className} h-10 w-full px-3 cursor-pointer flex items-center hover:bg-primary justify-start rounded-md`} {...props}>
            {children}
        </div>
    )
}
function link({ children, className, ...props }) {
    return (
        <Link {...props} className={`${className} h-10 w-full px-3 cursor-pointer flex items-center hover:bg-primary justify-start rounded-md`} {...props}>
            {children}
        </Link>
    )
}
ActionDropdown.List = List;
ActionDropdown.Context = Context;
ActionDropdown.Trigger = Trigger;
ActionDropdown.Link = link;
export default ActionDropdown