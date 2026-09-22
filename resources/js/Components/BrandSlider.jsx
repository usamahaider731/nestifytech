import React, { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext'; // Fixed typo if applicable
import { Link } from '@inertiajs/react';
import Slider from 'react-infinite-logo-slider';
import axios from 'axios'; // Added missing import
import ImageViwer from './Admin/ImageViwer';

const BrandSlider = () => {
    const { __ } = useLang();
    const [brands, setBrands] = useState([]); // Fixed camelCase convention

    useEffect(() => {
        axios.get(route('api.get_taxonomies', { type: 'brand', image: true })).then((res) => {
            setBrands(res.data);
        });
    }, []);

    return (
        <div className='w-full py-5'>
            <div className='container mx-auto px-5 overflow-hidden'>
                <Slider pauseOnHover={true} speed={3} >
                    {brands.map((brand, index) => {
                        return (
                            <Slider.Slide key={index}   width='250'>
                                <Link className='w-full grayscale-100 hover:grayscale-0'>
                                    <div className='w-full flex items-center justify-center text-center'>
                                        <ImageViwer 
                                            image={brand.image} 
                                            alt={brand.title} 
                                            width={100}  
                                            height={56}
                                            className='w-auto mx-auto h-14 max-h-14 object-contain' 
                                        />
                                    </div>
                                </Link>
                            </Slider.Slide>
                        );
                    })}
                </Slider>
            </div>
        </div>
    );
};

export default BrandSlider;