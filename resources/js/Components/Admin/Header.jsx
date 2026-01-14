import { usePage } from '@inertiajs/react'
import React, { useEffect, useRef, useState } from 'react'
import { RiAccountBox2Line, RiAccountBoxLine, RiAccountCircle2Line, RiAccountCircleLine, RiChat3Line, RiChat4Line, RiExpandUpDownLine } from 'react-icons/ri'
import { TbHeadphones } from 'react-icons/tb';
function Header() {
    const { auth } = usePage().props;
    const [MessageContent, SetMessageContent] = useState(false);
    const dropdownRef = useRef(null);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            SetMessageContent(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        // <div className='sticky top-0 left-0 w-full flex items-center px-5 justify-end shadow h-20 bg-white'>
        //     <div className='flex items-center gap-5 h-full relative'>
        //         <div className='flex gap-2 items-center text-gray-600 cursor-pointer font-roboto font-medium text-base'>
        //             <RiAccountCircleLine className='h-6 w-6' />
        //             <span>
        //                 {auth.user.name}
        //             </span>
        //         </div>
        //         <div ref={dropdownRef} className=''>
        //         <div onClick={() => {
        //             SetMessageContent(!MessageContent);
        //         }} className='h-9 w-9 bg-gray-200 relative rounded-full text-white flex items-center justify-center'>
        //             <RiChat4Line className='h-4 w-4' />
        //             <span className='bg-red-600 h-4.5 font-medium font-roboto flex items-center justify-center w-4.5 absolute top-0 right-0 translate-x-1/2 rounded-full text-[9px]'>9+</span>
        //         </div>
        //         <div className={`absolute top-[calc(100%+32px)] z-40 right-0 bg-white shadow p-5 transform transition-all w-72 ${MessageContent ? 'scale-100' : 'scale-0'}`}></div>
        //     </div>
        //     </div>
        // </div>
        <div className='w-full backdrop-blur-2xl pt-5 px-6 sticky top-0 left-0'>
            <div className='bg-accent w-full mx-auto p-5 rounded-md'>
            </div>
        </div>
    )
}

export default Header
