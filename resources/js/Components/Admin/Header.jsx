import { usePage } from '@inertiajs/react'
import React, { useEffect, useRef, useState } from 'react'
import { RiLogoutBoxRLine, RiProfileLine, RiSearchLine, RiSettings3Line, RiUser2Line, RiUser3Fill, RiUser4Fill, RiUser4Line, RiUser6Line } from 'react-icons/ri'
import { IoNotificationsOutline } from "react-icons/io5";
import Dropdown from '../Dropdown';
import ImageViwer from './ImageViwer';
import SearchPopup from './SearchPopup';
import { FaUser } from 'react-icons/fa';
function Header() {
    const { auth } = usePage().props;
    const [MessageContent, SetMessageContent] = useState(false);
    const [SearchDropdownOpen, SetSearchDropdownOpen] = useState(false);
    const [SearchLists, SetSearchLists] = useState([]);
    const dropdownRef = useRef(null);
    const dropdownRef2 = useRef(null);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            SetSearchDropdownOpen(false);
        }
        if (dropdownRef2.current && !dropdownRef2.current.contains(event.target)) {
            SetSearchDropdownOpen(false);
        }
    };
    const [SearchKeyword, SetSearchKeyword] = useState('');
    const [ShowSearchPopup, SetShowSearchPopup] = useState(false)
    const handleSearchPopup = () => {
        SetShowSearchPopup(true)

        SetSearchLists([]);
        // fetch(`${route('search.keywords')}?keyword=${SearchKeyword}`, {
        //     method: "GET",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "X-CSRF-TOKEN": document
        //             .querySelector('meta[name="csrf-token"]')
        //             ?.getAttribute("content"),
        //     },
        // })
        //     .then((res) => res.json())
        //     .then((res) => {
        //         SetSearchLists(res);
        //     });

    }
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {

    }, []);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === 'k') {
                event.preventDefault();
                document.querySelector("#searchField").click();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header className='w-full sticky top-0 z-40 bg-bg/50 backdrop-blur-md px-6 py-3'>
                <div className='bg-accent px-4 py-2.5 rounded-xl flex items-center shadow-md border border-white/5'>
                    <div className='flex-1 flex items-center gap-3'>
                        <div
                            className='flex items-center gap-2 text-res cursor-pointer hover:text-primary transition-colors'
                            onClick={() => handleSearchPopup()}
                            id='searchField'
                        >
                            <RiSearchLine className='text-xl' />
                            <span className='text-sm hidden sm:block font-medium'>Search (Ctrl+K)</span>
                        </div>
                    </div>
                    <div className='flex items-center gap-4'>
                        <button className='text-res hover:text-primary transition-colors'>
                            <IoNotificationsOutline className='text-2xl' />
                        </button>
                        <Dropdown>
                            <Dropdown.Trigger className='relative cursor-pointer transition-transform hover:scale-105'>
                                <ImageViwer image={auth.user.user_avater} className='size-10 rounded-full border-2 border-primary/20 p-0.5' />
                                <span className={`absolute bottom-px right-px size-3 rounded-full border-2 border-accent ${auth.user.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </Dropdown.Trigger>
                            <Dropdown.Content align='right' width='70' className='mt-3 translate-x-1' contentClasses='!border-0 !ring-0 shadow-xl overflow-hidden w-52 rounded-xl bg-accent'>
                                <div className='px-4 py-3 border-b border-white/5'>
                                    <div className='flex items-center gap-3'>
                                        <ImageViwer image={auth.user.user_avater} className='size-10 rounded-full bg-primary/10' />
                                        <div className='flex flex-col min-w-0'>
                                            <span className='text-heading text-sm font-semibold truncate'>{auth.user.name}</span>
                                            <span className='text-res text-xs truncate opacity-80'>{auth.user.user_role.join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className='p-1.5 space-y-0.5'>
                                    <Dropdown.Link className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-primary/10 hover:text-primary'>
                                        <FaUser className='text-base' />
                                        <span>My Profile</span>
                                    </Dropdown.Link>
                                    <Dropdown.Link className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-primary/10 hover:text-primary'>
                                        <RiSettings3Line className='text-xl' />
                                        <span>Settings</span>
                                    </Dropdown.Link>
                                    <div className='h-px bg-white/5 my-1' />
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className='flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-medium'
                                    >
                                        <RiLogoutBoxRLine className='text-xl' />
                                        <span>Logout</span>
                                    </Dropdown.Link>
                                </div>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </header>
            {
                ShowSearchPopup && <SearchPopup close={SetShowSearchPopup} />
            }
        </>
    )
}

export default Header
