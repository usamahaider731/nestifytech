import React, { useEffect, useState } from 'react';
import TextInput from '../TextInput';
import Dropdown from '../Dropdown';
import { RiAiGenerateText, RiAppsLine, RiBubbleChartFill, RiDashboardLine, RiFontSize2, RiFunctionLine, RiGlobalLine, RiLayoutTop2Line, RiMenu2Line, RiPaletteLine, RiPriceTag2Line, RiPriceTag3Line, RiSearch2Line, RiSettingsLine, RiShieldUserLine, RiShoppingBag3Line, RiShoppingCart2Line, RiTranslate2, RiTranslateAi } from 'react-icons/ri';
import { FaUser } from 'react-icons/fa';

const HeaderSearch = () => {
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
    const [Keywords, SetKeyWords] = useState("");
    const [SearchResults, SetSearchResults] = useState([]);
    const [Open, SetOpen] = useState(false)
    useEffect(() => {
        if (Keywords.length > 2) {
            let Route = "search.keywords";
            fetch(route(Route, { keyword: Keywords, client: true })).then((response) => response.json()).then((data) => {
                SetSearchResults(data);
            });
        }
        else {
            SetSearchResults([]);
        }
    }, [Keywords])
    return (
        <>
        
        <div onClick={()=> SetOpen(true)} className='mr-14.5 z-50 bg-white rounded-full flex items-center min-w-62.5 flex-1'>
            <Dropdown className="w-full">
                <Dropdown.Trigger className='relative z-50 h-12.5 rounded-l-full rounded-r-none border-r-0 border text-sm text-text !border-border '>
                    {({ open }) => (
                        <TextInput
                            value={Keywords}
                            onClick={(e) => {
                                if (open) {
                                    e.stopPropagation();
                                }
                            }}
                            onChange={(e) => SetKeyWords(e.target.value)}
                            className="min-h-full py-2.5 px-7.5 border-0 !shadow-none bg-transparent min-w-full"
                            placeholder="Search"
                        />
                    )}
                </Dropdown.Trigger>
                <Dropdown.Content className='min-w-full bg-white border-border' contentClasses='!border-border !ring-0 rounded-none'>
                    {
                        SearchResults.map((item, index) => (
                            <Dropdown.Link key={index} onClick={() => { SetKeyWords(item.title) }} className='flex items-center gap-3 border-b border-border'>
                                {IconMap[item.icon] || null}
                                {item.title}
                            </Dropdown.Link>
                        ))
                    }
                </Dropdown.Content>
            </Dropdown>
            <button className='bg-primary border cursor-pointer border-primary h-12.5 flex items-center justify-center rounded-r-full text-white w-16.5 text-md font-semibold'>
                <RiSearch2Line size={16} />
            </button>
        </div>
        {Open &&
        <div onClick={()=>SetOpen(false)} className='flex w-full z-30 min-h-screen fixed inset-0 bg-black/10'></div>
        }
        </>
    );
}

export default HeaderSearch;
