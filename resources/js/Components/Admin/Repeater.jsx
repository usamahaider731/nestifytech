import React from 'react'

function Repeater({ data = [] }) {
    function addItem() {
        const newItem = {}; // Define the structure of a new item
        setData([...data, newItem]);
    }
  return (
    <div>
      {data.map((item, index) => (
        <div key={index}>
          {

          }
        </div>
      ))}
    </div>
  )
}

export default Repeater