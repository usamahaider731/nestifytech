import { input } from '@/Utils/classes';
import React from 'react';
function InputField({ name, value, Readable , className, placeholder, required ,onChange, ...props }) {
  return (
    <input
      {...props}
      required
      name={name}
      value={value} 
      onChange={onChange}
      placeholder={placeholder}
      className={input +' '+ className}
    />
  );
}
export default InputField;