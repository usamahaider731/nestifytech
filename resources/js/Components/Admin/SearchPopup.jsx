import React, { useState, useEffect, useMemo } from 'react';
import { 
  RiCloseLine, 
  RiSearch2Line, 
  RiSettingsLine, 
  RiShoppingCart2Line, 
  RiDashboardLine, 
  RiShieldUserLine, 
  RiGlobalLine, 
  RiFontSize2, 
  RiPaletteLine, 
  RiAiGenerateText, 
  RiTranslate2, 
  RiTranslateAi, 
  RiShoppingBag3Line, 
  RiAppsLine, 
  RiPriceTag3Line, 
  RiFunctionLine, 
  RiPriceTag2Line, 
  RiLayoutTop2Line, 
  RiMenu2Line, 
  RiBubbleChartFill 
} from 'react-icons/ri';
import { FaUser } from 'react-icons/fa';
import { router } from '@inertiajs/react';

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

function SearchPopup({ close }) {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load Recent Searches from Local Storage
  useEffect(() => {
    const storedRecent = localStorage.getItem('recentSearches');
    if (storedRecent) {
      setRecentSearches(JSON.parse(storedRecent));
    }
  }, []);

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/search/keywords?keyword=${encodeURIComponent(searchValue)}`)
        .then(res => res.json())
        .then(data => {
            setResults(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Search error:', err);
            setLoading(false);
        });
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleNavigate = (page) => {
    // Save to recent searches
    const newRecent = [page, ...recentSearches.filter(p => p.route !== page.route)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    close(false);
    router.visit(page.route);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter' && results.length > 0) {
      handleNavigate(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      close(false);
    }
  };

  return (
    <div className="bg-[#25293c]/70 backdrop-blur-sm fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 w-full h-screen" onKeyDown={handleKeyDown}>
      <div className='w-full max-w-2xl bg-accent rounded-xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-200'>
        <div className='flex items-center px-4 py-3 gap-3 border-b border-white/5 bg-white/5'>
          <RiSearch2Line className='text-2xl text-primary' />
          <input
            autoFocus
            type="text"
            className='flex-1 bg-transparent border-none focus:ring-0 text-heading text-[15px] placeholder:text-res/50'
            placeholder='Search for apps, pages, or settings...'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {loading && (
            <div className='size-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          )}
          <div className='flex items-center gap-2'>
            <span className='px-2 py-0.5 rounded border border-white/10 text-[11px] font-bold text-res opacity-50 shadow-sm uppercase'>
              Esc
            </span>
            <button
              onClick={() => close(false)}
              className='p-1 hover:bg-white/10 rounded-full transition-colors text-res'
            >
              <RiCloseLine className='text-2xl' />
            </button>
          </div>
        </div>

        <div className='p-6 min-h-[350px] max-h-[500px] overflow-y-auto scroll-hidden'>
          {!searchValue ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div>
                <p className='text-[11px] font-bold uppercase tracking-wider text-secondary opacity-50 mb-4'>
                  Popular Searches
                </p>
                <div className='flex flex-wrap gap-2'>
                  {['Users', 'Products', 'Roles', 'Settings', 'Brands'].map(tag => (
                    <button 
                      key={tag} 
                      onClick={() => setSearchValue(tag)}
                      className='px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-all'
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-[11px] font-bold uppercase tracking-wider text-secondary opacity-50'>
                    Recent Searches
                  </p>
                  {recentSearches.length > 0 && (
                    <button onClick={clearRecent} className='text-[11px] font-bold text-primary hover:underline'>
                      Clear all
                    </button>
                  )}
                </div>
                <div className='space-y-1'>
                  {recentSearches.length > 0 ? recentSearches.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleNavigate(item)}
                      className='flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors'
                    >
                      <div className='p-2 rounded-lg bg-white/5 group-hover:bg-white/10'>
                        {IconMap[item.icon] || <RiSettingsLine className='text-gray-400' />}
                      </div>
                      <span className='text-sm text-res group-hover:text-heading'>{item.title}</span>
                    </div>
                  )) : (
                    <p className='text-xs text-res opacity-50'>No recent searches.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
                <p className='text-[11px] font-bold uppercase tracking-wider text-secondary opacity-50'>
                  {loading ? 'Searching...' : 'Search Results'}
                </p>
                {results.length > 0 ? (
                  <div className='space-y-1'>
                    {results.map((item, index) => (
                      <div 
                        key={index}
                        onClick={() => handleNavigate(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                          item.is_ai 
                            ? 'bg-gradient-to-r from-primary/20 to-indigo-500/20 border border-primary/20 shadow-lg shadow-primary/5' 
                            : index === selectedIndex 
                              ? 'bg-primary/20 translate-x-1' 
                              : 'hover:bg-white/5'
                        }`}
                      >
                        <div className='flex items-center gap-4'>
                          <div className={`p-2 rounded-xl border border-white/5 ${item.is_ai ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-accent'}`}>
                            {item.is_ai ? <RiAiGenerateText className="text-white text-lg animate-pulse" /> : (IconMap[item.icon] || <RiSettingsLine className='text-gray-400' />)}
                          </div>
                          <div className='flex flex-col'>
                            <span className={`text-sm font-semibold transition-colors ${item.is_ai ? 'text-primary' : (index === selectedIndex ? 'text-primary' : 'text-heading')}`}>
                              {item.title}
                            </span>
                            <span className='text-[11px] text-res opacity-60 flex items-center gap-2'>
                                {item.category} 
                                <span className='size-1 rounded-full bg-res opacity-30' />
                                <span className='opacity-50 text-[10px] uppercase font-bold tracking-tight'>{item.type}</span>
                            </span>
                          </div>
                        </div>
                        {item.is_ai ? (
                           <div className='flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/10'>
                              <span className='size-1.5 rounded-full bg-primary animate-ping' />
                              AI POWERED
                           </div>
                        ) : (
                          <RiSearch2Line className={`text-xl transition-opacity ${index === selectedIndex ? 'opacity-100' : 'opacity-0'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : !loading && (
                  <div className='flex flex-col items-center justify-center pt-10 text-center'>
                    <RiSearch2Line className='text-4xl text-res mb-3' />
                    <p className='text-sm text-heading font-medium'>No results found for "{searchValue}"</p>
                    <p className='text-xs text-res opacity-60 mt-1'>Try adjusting your search query.</p>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className='bg-white/5 px-6 py-3 border-t border-white/5 flex items-center gap-6 text-[11px] text-res/60 font-medium'>
          <div className='flex items-center gap-1.5'>
            <span className='p-0.5 rounded bg-accent border border-white/10 shadow-sm'>
              <RiSearch2Line className='size-3 rotate-90' />
            </span>
            <span>to select</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='px-1 py-0.5 rounded bg-accent border border-white/10 shadow-sm uppercase'>
              Enter
            </span>
            <span>to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPopup;