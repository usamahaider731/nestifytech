import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePage } from '@inertiajs/react';
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
    const [categoryValue, setcategoryValue] = useState("");
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

    return (
        <>
            <div className='ltr:mr-18.5 rtl:ml-18.5 z-50 bg-white rounded-full flex items-center min-w-62.5 flex-1'>
                <Dropdown className="flex-1">
                    <Dropdown.Trigger className='relative z-50 h-10 ltr:rounded-l-full ltr:rounded-r-none rtl:rounded-r-full rtl:rounded-l-none ltr:border-r-0 rtl:border-l-0 border-2 text-sm text-text !border-primary '>
                        {({ open }) => (
                            <TextInput
                                value={productKeyword}
                                onClick={(e) => {
                                    setProductDropdownOpen(!productDropdownOpen);
                                    if (open) {
                                        e.stopPropagation();
                                    }
                                }}
                                onChange={(e) => setProductKeyword(e.target.value)}
                                className="min-h-full text-sm font-medium h-full py-2.5 px-7.5 border-0 !shadow-none bg-transparent min-w-full"
                                placeholder={__('Search For Product')}
                            />
                        )}
                    </Dropdown.Trigger>
                    <Dropdown.Content className='min-w-full bg-white border-border' contentClasses='!border-border !ring-0 rounded-none'>
                        {productResults.map((item, index) => (
                            <Dropdown.List key={index} onClick={() => { setProductKeyword(item.title) }} className='flex items-center cursor-pointer gap-3 border-b border-border'>
                                <span>

                                {IconMap[item.icon] || null}
                                </span>
                                <span className="line-clamp-1">

                                {item.title}
                                </span>
                            </Dropdown.List>
                        ))}
                    </Dropdown.Content>
                </Dropdown>

                <Dropdown className="flex-1">
                    <Dropdown.Trigger className='relative z-50 h-10 rounded-r-none border-r-0 border-l-border border-l border-2 text-sm text-text !border-y-primary '>
                        {({ open }) => (
                            <div
                                value={categoryValue}
                                onClick={(e) => {
                                    setCategoryDropdownOpen(!categoryDropdownOpen);
                                    
                                }}
                                className="min-h-full font-medium text-text h-full py-2.5 px-7.5 border-0 flex items-center justify-between relative !shadow-none bg-transparent min-w-full"
                            >
                                {categoryValue || __('Select Category')}
                                <RiExpandUpDownFill className={`ml-2 ${categoryDropdownOpen ? 'rotate-180' : ''} transition-transform duration-300`} />
                            </div>
                        )}
                    </Dropdown.Trigger>
                    <Dropdown.Content className='min-w-full bg-white border-border' contentClasses='!border-border !ring-0 rounded-none'>
                        {searchCategories.map((item, index) => (
                            <Dropdown.List key={index} onClick={() => { setcategoryValue(item.title); setCategoryDropdownOpen(false); setProductDropdownOpen(false); }} className='flex items-center cursor-pointer gap-3 border-b border-border'>
                                {IconMap[item.icon] || null}
                                {item.title}
                            </Dropdown.List>
                        ))}
                    </Dropdown.Content>
                </Dropdown>
                <button className='bg-primary border cursor-pointer border-primary h-10 flex items-center justify-center ltr:rounded-r-full rtl:rounded-l-full text-white w-12.5 text-md font-semibold'>
                    <RiSearch2Line size={16} />
                </button>
            </div>
            {showSearchBackdrop && (
                <div onClick={() => { setProductDropdownOpen(false); setCategoryDropdownOpen(false); }} className='fixed inset-0 z-30 min-h-screen bg-black/10'></div>
            )}
        </>
    );
}

export default HeaderSearch;
