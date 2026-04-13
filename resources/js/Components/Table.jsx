import { Transition } from '@headlessui/react'
import React, { createContext, useContext, useEffect, useState } from 'react'
import Checkbox from './Checkbox'
import Dropdown from './Dropdown';
import { RiArrowDownSLine, RiSearchLine } from 'react-icons/ri';
import PrimaryButton from './PrimaryButton';
import TextInput from './TextInput';
import { router } from '@inertiajs/react';

const TableProvider = createContext();
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

function Table({
  children,
  values = EMPTY_ARRAY,
  bulk = EMPTY_OBJECT,
  columns = EMPTY_ARRAY,
  type = 'category',
  keywords = false,
  searchRoute = '',
  onDataUpdate,
  links = EMPTY_ARRAY,
  paginationPerPage = 10,
  paginationList = [10, 20, 50, 100]
}) {
  const [Values, SetValues] = useState([]);
  const [Links, SetLinks] = useState(links);
  const [Check, SetCheck] = useState([]);
  const [Search, SetSearch] = useState('');
  const [PerPage, SetPerPage] = useState(paginationPerPage);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (Array.isArray(values)) {
      if (values !== Values) SetValues(values);
      if (links !== Links) SetLinks(links);
    } else if (values?.data) {
      if (values.data !== Values) SetValues(values.data);
      if (values.links !== Links) SetLinks(values.links);
    }
  }, [values, links]);

  const SetAllCheck = () => {
    if (Check.length === Values.length) {
      SetCheck([]);
    } else {
      const allIds = Values.map(value => value.id);
      SetCheck(allIds);
    }
  };

  const handlePageClick = (url) => {
    if (!url) return;

    // Maintain search parameter and per_page
    const newUrl = new URL(url, window.location.origin);
    if (Search) {
      newUrl.searchParams.set('search', Search);
    }
    newUrl.searchParams.set('per_page', PerPage);

    fetch(newUrl.toString(), {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      }
    })
      .then(res => res.json())
      .then(data => {
        const newValues = data.data || data;
        if (data.data) {
          SetValues(data.data);
          SetLinks(data.links);
        } else {
          SetValues(data);
        }
        if (onDataUpdate) {
          onDataUpdate(newValues);
        }
      });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    SetSearch(value);

    if (timer) clearTimeout(timer);

    const newTimer = setTimeout(() => {
      if (searchRoute) {
        const baseUrl = route(searchRoute, { type: type });
        const url = new URL(baseUrl, window.location.origin);
        
        const currentParams = new URLSearchParams(window.location.search);
        for (const [key, val] of currentParams) {
          if (key !== 'search' && key !== 'per_page' && key !== 'type') {
            url.searchParams.set(key, val);
          }
        }
        
        url.searchParams.set('search', value);
        url.searchParams.set('per_page', PerPage);

        fetch(url.toString(), {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
          }
        })
          .then(res => {
            if (!res.ok) throw new Error('Search request failed');
            return res.json();
          })
          .then(data => {
            const newValues = data.data || data;
            if (data.data) {
              SetValues(data.data);
              SetLinks(data.links);
            } else if (Array.isArray(data)) {
              SetValues(data);
              SetLinks([]);
            }

            if (onDataUpdate) {
              onDataUpdate(newValues);
            }
          })
          .catch(err => {
            console.error('Table Search Error:', err);
          });
      }
    }, 500);
    setTimer(newTimer);
  };

  const handlePerPageChange = (value) => {
    SetPerPage(value);
    if (searchRoute) {
      const baseUrl = route(searchRoute, { type: type });
      const url = new URL(baseUrl, window.location.origin);
      
      const currentParams = new URLSearchParams(window.location.search);
      for (const [key, val] of currentParams) {
        if (key !== 'search' && key !== 'per_page' && key !== 'type') {
          url.searchParams.set(key, val);
        }
      }

      url.searchParams.set('search', Search);
      url.searchParams.set('per_page', value);

      fetch(url.toString(), {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        }
      })
        .then(res => res.json())
        .then(data => {
          const newValues = data.data || data;
          if (data.data) {
            SetValues(data.data);
            SetLinks(data.links);
          } else {
            SetValues(data);
          }
          if (onDataUpdate) {
            onDataUpdate(newValues);
          }
        });
    }
  };
  return (
    <TableProvider.Provider value={{ SetAllCheck, handleSearch, Search, SetSearch, SetCheck, Values, Check, SetValues, columns, Links, handlePageClick, PerPage, handlePerPageChange, paginationList }}>
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center gap-5 w-full justify-between'>

          {bulk && Object.keys(bulk).length > 0 && (
            <div className='flex items-center gap-3'>
              <Bulk bulk={bulk} />
            </div>
          )}
          {keywords && (
            <div className='flex items-center gap-4'>
              <div className='relative w-64'>
                <TextInput
                  className='w-full pl-10 h-10'
                  placeholder='Search...'
                  id={'search_keyword'}
                  value={Search}
                  onChange={handleSearch}
                />
                <RiSearchLine className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5' />
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-secondary'>Show:</span>
                <Dropdown>
                  <Dropdown.Trigger>
                    <div className='h-10 px-3 cursor-pointer rounded-md bg-accent border border-primary/10 text-primary text-sm flex items-center gap-2 min-w-[70px] justify-between'>
                      {PerPage}
                      <RiArrowDownSLine className='size-4' />
                    </div>
                  </Dropdown.Trigger>
                  <Dropdown.Content contentClasses='bg-accent ring-primary text-primary' align='right'>
                    {paginationList.map((item) => (
                      <Dropdown.List
                        key={item}
                        onClick={() => handlePerPageChange(item)}
                        className='text-primary hover:bg-white/10 cursor-pointer text-center'
                      >
                        {item}
                      </Dropdown.List>
                    ))}
                  </Dropdown.Content>
                </Dropdown>
              </div>
            </div>
          )}
        </div>
      </div>
      <table className='w-full table'>
        {children}
      </table>
      {Links && Links.length > 3 && (
        <Pagination />
      )}
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
function TH({ children, width = '', className = 'h-14', props }) {
  return (
    <th className={className} style={{ width: width }} {...props}> {children}</th >
  )
}
function TD({ children, className = '', props }) {
  return (
    <td className={className} {...props}>{children}</td>
  )
}

function CheckboxHead({ children, className = '', ...props }) {
  const { Values, Check, SetAllCheck } = useContext(TableProvider)
  return (
    <div className='relative h-fit mx-auto w-fit flex'>
      <Checkbox checked={Check.length === Values.length && Values.length != 0} onChange={() => SetAllCheck()} />
    </div>
  )
}
function CheckboxBody({ children, valueId = '', className = '', ...props }) {
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
function Bulk({ bulk = {} }) {
  const { Check, SetCheck, SetSearch, Search, handleSearch } = useContext(TableProvider)
  const [options, setOptions] = useState(bulk.options)
  const [current, SetCurrent] = useState({
    label: 'Bulk Action',
    value: 0
  })
  const submtBulkAction = () => {
    fetch(route(bulk.route), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify({
        action: current.value,
        type: bulk.type,
        table: bulk.table,
        column: bulk.column,
        is_meta: bulk.is_meta,
        ids: Check
      })
    }).then((res) => {
      if (res.status == 200) {
        let e = {
          target: {
            value: Search
          }
        }
        SetCheck([]);
        handleSearch(e);
      }
    })
  }
  return (
    <div className='relative h-fit mx-auto w-fit flex gap-5'>

      {Check.length > 0 && (
        <div className='relative h-fit mx-auto w-fit flex'>
          <Dropdown>
            <Dropdown.Trigger>
              <div className='h-9 w-32 cursor-pointer rounded-md bg-transparent border border-primary text-primary text-sm flex text-center items-center justify-center gap-3'>
                {current.label}
                <RiArrowDownSLine className='size-4' />
              </div>
            </Dropdown.Trigger>
            <Dropdown.Content contentClasses='bg-accent ring-primary text-primary' align='left'>
              {
                options.map((option, index) => {
                  return (
                    <Dropdown.List onClick={() => SetCurrent({ value: option.value, label: option.label })} key={option.value} className='text-primary hover:bg-white/10 cursor-pointer'>{option.label}</Dropdown.List>
                  )
                })
              }
            </Dropdown.Content>
          </Dropdown>
        </div>
      )}
      {Check.length > 0 && current.label != 'Bulk Action' &&
        <PrimaryButton onClick={() => { submtBulkAction() }} className='bg-primary cursor-pointer'>Submit</PrimaryButton>
      }
    </div>
  )
}
function Pagination() {
  const { Links, handlePageClick } = useContext(TableProvider);

  if (!Links || Links.length <= 3) return null;

  function getClassName(active) {
    if (active) {
      return "mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded focus:border-primary bg-primary text-white";
    } else {
      return "mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-primary hover:text-white transition-colors duration-200 text-primary";
    }
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap mt-8 justify-center">
        {Links.map((link, key) => (
          link.url === null ? (
            <div
              key={key}
              className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded"
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ) : (
            <button
              key={key}
              className={getClassName(link.active)}
              onClick={() => handlePageClick(link.url)}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          )
        ))}
      </div>
    </div>
  );
}

Table.THead = THead;
Table.TR = TR;
Table.TH = TH;
Table.TD = TD;
Table.TBody = TBody;
Table.TH.Checkbox = CheckboxHead;
Table.TD.Checkbox = CheckboxBody;
Table.Pagination = Pagination;
export default Table