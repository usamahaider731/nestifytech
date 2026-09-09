import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import { RiArrowDownSLine, RiArrowDropDownLine } from 'react-icons/ri';
import ImageViwer from '../Admin/ImageViwer';
import { usePage } from '@inertiajs/react';

const LanguageDropdown = () => {
    const [languages, setLanguages] = useState([]);
    const [currentLanguage, setCurrentLanguage] = useState("");
    useEffect(() => {
        axios.get('/api/language')
            .then(response => {
                setLanguages(response.data); 
            })
            .catch(error => {
                console.error(error);
            });
    }, []);
    useEffect(()=>{
        if(languages.length > 0){
            languages.find(language => {
                if(language.is_default){
                    setCurrentLanguage(language);
                }
            });
        }
    },[languages])
    return (
        <div>
            <Dropdown>
                <Dropdown.Trigger>
                    <button className='font-light flex items-center gap-1'>
                        <ImageViwer className='size-4' image={currentLanguage.image} />
                        <RiArrowDownSLine size={20} className={``} />
                    </button>
                </Dropdown.Trigger>
                <Dropdown.Content contentClasses='border-border bg-white rounded-none border !ring-0' className='max-w-24 border-border bg-white border rounded-none'>
                    {
                        languages.map((language) => (
                            <Dropdown.List onClick={() => setCurrentLanguage(language)} key={language.id} className='flex items-center cursor-pointer gap-2 hover:bg-gray-100'>
                                <ImageViwer className='size-4' image={language.image} />
                                {language.name}
                            </Dropdown.List>
                        ))
                    }
                </Dropdown.Content>

            </Dropdown>
        </div>
    );
}

export default LanguageDropdown;
