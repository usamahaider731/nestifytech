import React from 'react'

function Popup({children}) {
  return (
    <div className='fixed top-0 left-0 flex items-center justify-center w-full h-full bg-white/50 backdrop-blur-sm'>
      {children}
    </div>
  )
}
function PopupBox({children}) {
    return(
        <div className='bg-white rounded-md w-full py-3 max-w-110 overflow-hidden flex flex-col'>
            {children}
        </div>
    )
}
function PopupHeader({children}) {
    return(
        <div className='flex pt-0 px-5 pb-3 items-center border-b border-dynamic justify-between'>
            {children}
        </div>
    )
}
function PopupSection({children, className=''}){
    return(
        <div className={`flex flex-col items-center justify-between ${className}`}>
            {children}
        </div>
    )
}
Popup.PopupBox = PopupBox;
Popup.PopupHeader = PopupHeader;
Popup.PopupSection = PopupSection;
export default Popup
