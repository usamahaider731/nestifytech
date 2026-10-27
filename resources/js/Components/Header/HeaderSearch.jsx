import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { router, usePage } from '@inertiajs/react';
import TextInput from '../TextInput';
import Dropdown from '../Dropdown';
import { RiAiGenerateText, RiAppsLine, RiArrowUpDownFill, RiBubbleChartFill, RiDashboardLine, RiExpandUpDownFill, RiFontSize2, RiFunctionLine, RiGlobalLine, RiLayoutTop2Line, RiMenu2Line, RiPaletteLine, RiPriceTag2Line, RiPriceTag3Line, RiSearch2Line, RiSettingsLine, RiShieldUserLine, RiShoppingBag3Line, RiShoppingCart2Line, RiTranslate2, RiTranslateAi } from 'react-icons/ri';
import { FaUser } from 'react-icons/fa';

const HeaderSearch = () => {
    const { __ } = useLang();
    const { searchCategories = [] } = usePage().props;
    const IconMap = {
        RiDashboardLine: <RiDashboardLine className="text-blue-400" />,
        FaUser: <FaUser className="text-green-400" />,
        RiShieldUserLine: <RiShieldUserLine className="text-purple-400" />,
        RiGlobalLine: <RiGlobalLine className="text-yellow-400" />,
        RiFontSize2: <RiFontSize2 className="text-indigo-400" />,
        RiPaletteLine: <RiPaletteLine className="text-pink-400" />,
        RiAiGenerateText: <RiAiGenerateText className="text-cyan-400" />,
        RiTranslate2: <RiTranslate2 className="text-orange-400" />,
        RiTranslateAi: <RiTranslateAi className="text-red-400" />,
        RiShoppingBag3Line: <RiShoppingBag3Line className="text-emerald-400" />,
        RiAppsLine: <RiAppsLine className="text-sky-400" />,
        RiPriceTag3Line: <RiPriceTag3Line className="text-violet-400" />,
        RiFunctionLine: <RiFunctionLine className="text-rose-400" />,
        RiPriceTag2Line: <RiPriceTag2Line className="text-amber-400" />,
        RiLayoutTop2Line: <RiLayoutTop2Line className="text-blue-500" />,
        RiMenu2Line: <RiMenu2Line className="text-gray-400" />,
        RiBubbleChartFill: <RiBubbleChartFill className="text-purple-500" />,
        RiSettingsLine: <RiSettingsLine className="text-gray-400" />,
        RiShoppingCart2Line: <RiShoppingCart2Line className="text-green-400" />,
    };

    const [productKeyword, setProductKeyword] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [productResults, setProductResults] = useState([]);
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const showSearchBackdrop = productDropdownOpen || categoryDropdownOpen;
    const productSearchTimer = useRef(null);

    useEffect(() => {
        if (!productKeyword.trim()) {
            setProductDropdownOpen(false);
            setProductResults([]);
            return;
        }

        if (productKeyword.trim().length <= 2) {
            setProductDropdownOpen(false);
            setProductResults([]);
            return;
        }

        clearTimeout(productSearchTimer.current);
        productSearchTimer.current = setTimeout(() => {
            setProductDropdownOpen(true);
            fetch(route('search.keywords', { keyword: productKeyword, type: 'product', client: true }))
                .then((response) => response.json())
                .then((data) => setProductResults(data));
        }, 250);

        return () => clearTimeout(productSearchTimer.current);
    }, [productKeyword]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setProductDropdownOpen(false);
        setCategoryDropdownOpen(false);

        const params = {};
        if (productKeyword.trim()) {
            params.q = productKeyword.trim();
        }
        if (selectedCategory?.id) {
            params.category = selectedCategory.id;
        }

        router.get(route('search'), params);
    };

    const handleSelectResult = (item) => {
        setProductDropdownOpen(false);
        if (item.route && item.route !== '#ai-search') {
            router.get(item.route);
        } else {
            setProductKeyword(item.title);
            router.get(route('search'), { q: item.title });
        }
    };

    return (
        <>
            <form onSubmit={handleSearchSubmit} className='lg:ltr:mr-10 lg:rtl:ml-10 z-50 bg-white rounded-full flex items-center min-w-0 flex-1 relative'>
                <Dropdown className="flex-1 min-w-0">
                    <Dropdown.Trigger className='relative z-50 h-8 sm:h-9 lg:h-10 ltr:rounded-l-full ltr:rounded-r-none rtl:rounded-r-full rtl:rounded-l-none ltr:border-r-0 rtl:border-l-0 border-2 text-sm text-text !border-primary '>
                        {({ open }) => (
                            <TextInput
                                value={productKeyword}
                                onClick={(e) => {
                                    if (productResults.length > 0) {
                                        setProductDropdownOpen(true);
                                    }
                                    if (open) {
                                        e.stopPropagation();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearchSubmit(e);
                                    }
                                }}
                                onChange={(e) => setProductKeyword(e.target.value)}
                                className="min-h-full text-[10px] sm:text-xs lg:text-sm font-medium h-full py-1.5 sm:py-2.5 px-3 lg:px-5 border-0 !shadow-none bg-transparent min-w-full"
                                placeholder={__('Search For Product')}
                            />
                        )}
                    </Dropdown.Trigger>
                    {productDropdownOpen && productResults.length > 0 && (
                        <Dropdown.Content className='min-w-full bg-white border-border shadow-lg max-h-80 overflow-y-auto' contentClasses='!border-border !ring-0 rounded-none'>
                            {productResults.map((item, index) => (
                                <Dropdown.List
                                    key={index}
                                    onClick={() => handleSelectResult(item)}
                                    className='flex items-center cursor-pointer gap-3 border-b border-border py-2.5 px-4 hover:bg-primary/5 transition-colors'
                                >
                                    <span>
                                        {IconMap[item.icon] || null}
                                    </span>
                                    <span className="line-clamp-1 text-xs font-medium text-heading">
                                        {item.title}
                                    </span>
                                </Dropdown.List>
                            ))}
                            <div
                                onClick={handleSearchSubmit}
                                className="p-2.5 text-center bg-primary/10 hover:bg-primary/20 text-heading text-xs font-bold cursor-pointer transition-colors border-t border-primary/20"
                            >
                                {__('View all results for ":query"', { query: productKeyword })} →
                            </div>
                        </Dropdown.Content>
                    )}
                </Dropdown>

                <Dropdown className="hidden md:block flex-1 min-w-0">
                    <Dropdown.Trigger className='relative z-50 h-9 lg:h-10 rounded-r-none border-r-0 border-l-border border-l border-2 text-xs lg:text-sm text-text !border-y-primary '>
                        {({ open }) => (
                            <div
                                onClick={(e) => {
                                    setCategoryDropdownOpen(!categoryDropdownOpen);
                                }}
                                className="min-h-full  font-medium text-text h-full py-1.5 sm:py-2.5 px-3 lg:px-6 border-0 flex items-center justify-between relative !shadow-none bg-transparent min-w-full cursor-pointer select-none"
                            >
                                <span className="truncate">
                                    {selectedCategory?.title || __('Select Category')}
                                </span>
                                <RiExpandUpDownFill className={`ml-2 shrink-0 ${categoryDropdownOpen ? 'rotate-180' : ''} transition-transform duration-300`} />
                            </div>
                        )}
                    </Dropdown.Trigger>
                    {categoryDropdownOpen && (
                        <Dropdown.Content className='min-w-full bg-white border-border shadow-lg max-h-80 overflow-y-auto' contentClasses='!border-border !ring-0 rounded-none'>
                            <Dropdown.List
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setCategoryDropdownOpen(false);
                                }}
                                className='flex items-center cursor-pointer gap-3 border-b border-border py-2 px-4 hover:bg-primary/10 text-xs font-semibold'
                            >
                                <RiAppsLine size={15} className="text-res" />
                                <span>{__('All Categories')}</span>
                            </Dropdown.List>
                            {searchCategories.map((item, index) => (
                                <Dropdown.List
                                    key={index}
                                    onClick={() => {
                                        setSelectedCategory(item);
                                        setCategoryDropdownOpen(false);
                                    }}
                                    className='flex items-center cursor-pointer gap-3 border-b border-border py-2 px-4 hover:bg-primary/10 text-xs font-medium'
                                >
                                    {IconMap[item.icon] || null}
                                    <span>{item.title}</span>
                                </Dropdown.List>
                            ))}
                        </Dropdown.Content>
                    )}
                </Dropdown>

                <button
                    type="submit"
                    className='bg-primary hover:brightness-95 border cursor-pointer border-primary h-8 sm:h-9 lg:h-10 flex items-center justify-center ltr:rounded-r-full rtl:rounded-l-full text-white w-10 sm:w-12.5 text-md font-semibold transition-all shrink-0'
                    title={__('Search')}
                    aria-label={__('Search')}
                >
                    <RiSearch2Line size={16} />
                </button>
            </form>

            {showSearchBackdrop && (
                <div onClick={() => { setProductDropdownOpen(false); setCategoryDropdownOpen(false); }} className='fixed inset-0 z-30 min-h-screen bg-black/10'></div>
            )}
        </>
    );
}

export default HeaderSearch;

