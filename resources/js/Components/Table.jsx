import { Transition } from '@headlessui/react'
import React, { createContext, useContext, useState } from 'react'
import Checkbox from './Checkbox'
  const TableProvider = createContext();
function Table({ children, values=[] }) {
  const [Values, SetValues] = useState(values);
  const [Check, SetCheck] = useState([]);
  const SetAllCheck = () => {
    if (Check.length === Values.length) {
      SetCheck([]);
    } else {
      const allIds = Values.map(value => value.id);
      SetCheck(allIds);
    }
  };
  return (
    <TableProvider.Provider value={{ SetAllCheck, SetCheck, Values, Check, SetValues }}>
      <table className='w-full table'>
        {children}
      </table>
    </TableProvider.Provider>
  )
}
function THead({ children, className }) {
  return (
    <thead className={`w-full ${className}`}>
      {children}
    </thead>
  )
}
function TBody({ children }) {
  return (
    <tbody className='w-full'>
      {children}
    </tbody>
  )
}
function TR({ children, className = 'w-full text-heading uppercase text-sm h-14 bg-accent' }) {
  return (
    <tr className={className}>{children}</tr>
  )
}
function TH({ children, className = 'h-14' }) {
  return (
    <th className={className}>{children}</th>
  )
}
function TD({ children, className = '' }) {
  return (
    <td className={className}>{children}</td>
  )
}
function CheckboxHead({ children, className = '', ...props }) {
  const { Values, Check, SetAllCheck } = useContext(TableProvider)
  return (
    <div className='relative h-fit mx-auto w-fit flex'>
      <Checkbox checked={ Check.length === Values.length} onChange={() => SetAllCheck()} />
    </div>
  )
}
function CheckboxBody({ children, valueId='',className = '', ...props }) {
  const { Values, Check, SetCheck } = useContext(TableProvider)
  return (
    <div className='relative h-fit mx-auto w-fit flex'>
      <Checkbox
        checked={Check.includes(valueId)}
        onChange={() => {
          if (Check.includes(valueId)) {
            SetCheck(Check.filter(id => id !== valueId));
          } else {
            SetCheck([...Check, valueId]);
          }
        }}
      />
    </div>
  )
}
Table.THead = THead;
Table.TR = TR;
Table.TH = TH;
Table.TD = TD;
Table.TBody = TBody;
Table.TH.Checkbox = CheckboxHead;
Table.TD.Checkbox = CheckboxBody;
export default Table