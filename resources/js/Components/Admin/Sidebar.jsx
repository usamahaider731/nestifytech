import { Link, usePage } from '@inertiajs/react';
import React, { useEffect, useState, useMemo } from 'react';
import { hasPermission } from '@/Utils/helper';

const Icon = ({ name, className = "size-5" }) => (
  <svg className={className} fill="currentColor">
    <use href={`/assets/icon/remix/remixicon.symbol.svg#${name}`} />
  </svg>
);

function Sidebar() {
  const { url, auth, setting } = usePage().props;
  const [open, setOpen] = useState(null);

  const menuData = setting?.sidebar_menu || [];
console.log(menuData)
  const menuStructure = useMemo(() => {
    return menuData.map(group => ({
      ...group,
      menu: group.menu.map(item => ({
        ...item,
        icon: <Icon name={item.icon} className={item.icon.includes('ri-') ? (item.id === 'users' ? 'size-4' : 'size-5') : 'size-5'} />,
        route: item.route ? route(item.route, item.params || {}) : null,
        menu: item.menu ? item.menu.map(sub => ({
          ...sub,
          icon: <Icon name={sub.icon} className="size-4" />,
          route: sub.route ? route(sub.route, sub.params || {}) : null,
        })) : null
      }))
    }));
  }, [menuData]);

  const menu = useMemo(() => {
    return menuStructure.map(group => {
      // Filter the initial items in the group
      let filteredGroupMenu = group.menu.reduce((acc, item) => {
        // Super Admins ignore all permission checks (optional depending on your role structure, 
        // but for now, we rely strictly on permissions object attached to user)
        // If the item has a "menu" (submenus), filter those
        if (item.menu) {
          const filteredSubmenu = item.menu.filter(sub => hasPermission(auth.user, sub.permission));
          // If the item itself requires a permission and lacks it, exclude the entire item
          if (item.permission && !hasPermission(auth.user, item.permission)) return acc;

          // If it passed or had no base permission, include it with its filtered submenu if submenu is not empty
          if (filteredSubmenu.length > 0) {
            acc.push({ ...item, menu: filteredSubmenu });
          } else if (!item.permission || hasPermission(auth.user, item.permission)) {
            console.log(item)    
          }
        } else {
          // No submenu, just check item.permission
          if (!item.permission || hasPermission(auth.user, item.permission)) {
            acc.push(item);
          }
        }
        return acc;
      }, []);

      return { ...group, menu: filteredGroupMenu };
    }).filter(group => group.menu.length > 0); // Don't show groups that have no items visible
  }, [auth.user]);

  useEffect(() => {
    menu.forEach((group) => {
      group.menu.forEach((item) => {
        if (item.menu) {
          item.menu.forEach((sub) => {
            if (url === new URL(sub.route, window.location.origin).pathname) {
              setOpen(item.id);
            }
          });
        }
      });
    });
  }, [url]);

  const isActive = (itemRoute) =>
    url === new URL(itemRoute, window.location.origin).pathname;

  const toggleMenu = (id) => {
    setOpen(open === id ? null : id);
  };
  console.log(menu)
  return (
    <div className="flex flex-col px-3.5 gap-4 overflow-y-auto scroll-hidden pt-3 pb-10">
      {menu.map((group) => (
        <div key={group.id} className="gap-1 flex flex-col">
          <div className="flex items-center gap-3 px-3 mt-3 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary">
              {group.title}
            </span>
            <div className="h-px flex-1 bg-permanent/30" />
          </div>

          <div className="flex w-full flex-col gap-1">
            {group.menu.map((item) => (
              <div className="relative" key={item.id}>
                {item.menu ? (
                  <div
                    onClick={() => toggleMenu(item.id)}
                    className={`flex items-center cursor-pointer py-2.5 relative text-[14px] transition-all duration-200 font-medium gap-3 w-full rounded-lg px-3.5 ${open === item.id ? 'text-heading bg-dynamic/50' : 'text-res hover:bg-dynamic/40 hover:text-heading'}`}
                  >
                    <span className={`transition-colors ${open === item.id ? 'text-primary' : 'text-res'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.title}</span>
                    <Icon
                      name="ri-arrow-right-s-line"
                      className={`size-4 transition-transform duration-200 text-secondary ${open === item.id ? 'rotate-90 text-heading' : ''
                        }`}
                    />
                  </div>
                ) : (
                  <Link
                    href={item.route}
                    className={`flex items-center py-2.5 text-[14px] transition-all duration-200 gap-3 w-full rounded-lg px-3.5 ${isActive(item.route)
                      ? 'bg-gradient-to-r from-primary to-[#9e95f5] text-white shadow-[0_2px_6px_0_rgba(115,103,240,0.48)] font-semibold translate-x-1'
                      : 'text-res hover:bg-dynamic/40 hover:text-heading hover:translate-x-1'
                      }`}
                  >
                    <span className={`${isActive(item.route) ? 'text-white' : 'text-current'}`}>
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </Link>
                )}

                {item.menu && (
                  <div
                    className={`overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${open === item.id ? 'max-h-[500px] mt-1' : 'max-h-0'
                      }`}
                  >
                    {item.menu.map((sub) => (
                      <Link
                        key={sub.id}
                        href={sub.route}
                        className={`flex items-center py-2 text-[13px] transition-all duration-200 gap-3 w-full rounded-lg pl-10 pr-3.5 mb-0.5 ${isActive(sub.route)
                          ? 'text-primary font-semibold bg-primary/12 shadow-sm'
                          : 'text-res hover:bg-dynamic/30 hover:text-heading hover:pl-11'
                          }`}
                      >
                        <Icon name="ri-circle-fill" className={`size-1.5 ${isActive(sub.route) ? 'fill-primary' : 'fill-secondary/60'}`} />
                        <span>{sub.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="h-px bg-permanent/30 my-2 mx-3" />

      <Link
        href={route('logout')}
        method="post"
        as="button"
        className="flex items-center cursor-pointer py-2.5 text-[14px] font-medium transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-500 gap-3 w-full rounded-lg px-3.5"
      >
        <Icon name="ri-logout-circle-line" className="size-5" />
        <span>Log Out</span>
      </Link>
    </div>
  );
}

export default Sidebar;