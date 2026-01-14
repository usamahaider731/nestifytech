import { textarea } from '@/Utils/classes'
import React from 'react'

function Textarea({ rows = 3, placeholder = '', className = '', ...props}) {
  return (
    <textarea className={`${className + textarea} `} {...props} rows={rows} placeholder={placeholder}>

    </textarea>
  )
}

export default Textarea
