import { usePage, Link } from '@inertiajs/react'
import React, { useEffect, useRef, useState } from 'react'
import { RiLogoutBoxRLine, RiProfileLine, RiSearchLine, RiSettings3Line, RiUser3Line, RiGlobalLine, RiLayoutGridLine, RiMoonLine, RiSunLine } from 'react-icons/ri'
import { IoNotificationsOutline } from "react-icons/io5";
import Dropdown from '../Dropdown';
import ImageViwer from './ImageViwer';
import SearchPopup from './SearchPopup';
import { useTheme } from '@/contexts/ThemeContext';

function Header() {
    const { auth } = usePage().props;
    const { theme, toggleTheme } = useTheme();
    const [SearchLists, SetSearchLists] = useState([]);
    const dropdownRef = useRef(null);
    const [ShowSearchPopup, SetShowSearchPopup] = useState(false);

    const handleSearchPopup = () => {
        SetShowSearchPopup(true);
        SetSearchLists([]);
    }

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                document.querySelector("#searchField")?.click();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header className='sticky top-0 left-0 right-0 z-40 backdrop-blur-sm pb-2'>
                <div className=' mx-6 my-2 mt-5 bg-accent/95 backdrop-blur-md px-4 py-2 rounded-xl border border-permanent/40 shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] transition-all duration-300'>
                    <div className='flex items-center justify-between w-full'>
                       
                        <div className='flex items-center gap-3 flex-1'>
                            <div
                                className='flex items-center gap-3 w-full justify-between text-secondary hover:text-heading cursor-pointer transition-colors bg-bg/40 hover:bg-bg/70 px-3 py-2 rounded-lg border border-permanent/30'
                                onClick={() => handleSearchPopup()}
                                id='searchField'
                            >
                                <div className='flex items-center gap-3'>
                                    <RiSearchLine className='text-lg text-secondary' />
                                    <span className='text-xs font-medium text-res hidden sm:inline-block'>Search (Ctrl+K)</span>
                                </div>
                                <kbd className='text-[10px] bg-dynamic/70 px-1.5 py-0.5 rounded text-secondary font-mono font-bold border border-permanent/40 shadow-xs hidden sm:inline-block'>⌘K</kbd>
                            </div>
                        </div>

                        <div className='flex items-center gap-1.5 sm:gap-3'>
                            <button className='p-2 rounded-lg text-res hover:text-primary hover:bg-dynamic/50 transition-colors relative' title="Language">
                                <RiGlobalLine className='text-xl' />
                            </button>

                            <button
                                onClick={toggleTheme}
                                className='p-2 rounded-lg text-res hover:text-primary hover:bg-dynamic/50 transition-all duration-300 relative overflow-hidden'
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}>
                                    <RiMoonLine className='text-xl' />
                                </span>
                                <span className={`flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`}>
                                    <RiSunLine className='text-xl text-amber-400' />
                                </span>
                            </button>

                            <button className='p-2 rounded-lg text-res hover:text-primary hover:bg-dynamic/50 transition-colors hidden sm:block' title="Shortcuts">
                                <RiLayoutGridLine className='text-xl' />
                            </button>

                            <button className='p-2 rounded-lg text-res hover:text-primary hover:bg-dynamic/50 transition-colors relative' title="Notifications">
                                <IoNotificationsOutline className='text-xl' />
                                <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 animate-pulse ring-2 ring-accent' />
                            </button>

                            <div className='h-5 w-px bg-permanent/40 mx-1' />

                            <Dropdown>
                                <Dropdown.Trigger className='relative cursor-pointer transition-transform hover:scale-105 ml-1'>
                                    <div className='relative'>
                                        <ImageViwer image={auth.user.user_avater} className='size-9 rounded-full border-2 border-primary/40 p-0.5 object-cover shadow-sm' />
                                        <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-accent ${auth.user.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </div>
                                </Dropdown.Trigger>
                                <Dropdown.Content align='right' width='60' className='mt-2' contentClasses='!border !border-permanent/40 shadow-2xl overflow-hidden rounded-xl bg-accent p-0 w-60'>
                                    <div className='px-4 py-3.5 border-b border-permanent/30 bg-dynamic/30'>
                                        <div className='flex items-center gap-3'>
                                            <ImageViwer image={auth.user.user_avater} className='size-10 rounded-full bg-primary/10 border border-primary/20 object-cover' />
                                            <div className='flex flex-col min-w-0'>
                                                <span className='text-heading text-sm font-bold truncate leading-snug'>{auth.user.name}</span>
                                                <span className='inline-block text-[10px] font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 w-max'>
                                                    {Array.isArray(auth.user.user_role) ? auth.user.user_role.join(', ') : 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='p-2 space-y-1 text-xs font-medium'>
                                        <Dropdown.Link href={route('user.edit', { id: auth.user.id, type: 'user' })} className='flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-primary/10 hover:text-primary text-res'>
                                            <RiUser3Line className='text-base text-secondary' />
                                            <span>My Profile</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('admin.setting', { type: 'site' })} className='flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-primary/10 hover:text-primary text-res'>
                                            <RiSettings3Line className='text-base text-secondary' />
                                            <span>Settings</span>
                                        </Dropdown.Link>

                                        <div className='h-px bg-permanent/30 my-1' />

                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className='flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-semibold text-xs'
                                        >
                                            <RiLogoutBoxRLine className='text-base' />
                                            <span>Logout</span>
                                        </Dropdown.Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div></div>
            </header>

            {ShowSearchPopup && <SearchPopup close={SetShowSearchPopup} />}
        </>
    )
}

export default Header

