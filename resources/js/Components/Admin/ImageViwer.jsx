import React from 'react'
import SvgViewer from './SvgViewer'

function ImageViwer({ image, className='' }) {
    if (image.filename.endsWith('.svg')) {
        return (
            <SvgViewer key={image.filename} src={`/storage/uploads/image/${image.filename}`} className={className} />
        )
    }
    if (image.filename.endsWith('.avif')){
        return(
            <img src={`/storage/uploads/image/${image.filename}`} className={`${className}`} alt="" />
        )
    }
    else {
        return (
            <img src={route('thumb.image', { filename: image.name, height: '300', width: '300', extension: 'jpg' })} className={`${className}`} alt="" />
        )
    }

}

export default ImageViwer
