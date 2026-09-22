import React from 'react';
import Dropdown from '../Dropdown';
import { RiArrowDownSLine } from 'react-icons/ri';
import ImageViwer from '../Admin/ImageViwer';
import { useLang } from '@/contexts/LanguageContext';

const LanguageDropdown = () => {
    const { languages, currentLanguage, setLanguage } = useLang();

    return (
        <div>
            <Dropdown>
                <Dropdown.Trigger>
                    <button type="button" className='font-light flex items-center gap-1'>
                        <ImageViwer className='size-4' image={currentLanguage?.image} />
                        <RiArrowDownSLine size={20} />
                    </button>
                </Dropdown.Trigger>
                <Dropdown.Content contentClasses='border-border bg-white rounded-none border !ring-0' className='max-w-24 border-border bg-white border rounded-none'>
                    {languages.map((language) => (
                        <Dropdown.List
                            onClick={() => setLanguage(language)}
                            key={language.prefix}
                            className='flex items-center cursor-pointer gap-2 hover:bg-gray-100'
                        >
                            <ImageViwer className='size-4' image={language.image} />
                            {language.name}
                        </Dropdown.List>
                    ))}
                </Dropdown.Content>
            </Dropdown>
        </div>
    );
};

export default LanguageDropdown;
