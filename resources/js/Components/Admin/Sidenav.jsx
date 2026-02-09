import { Link, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

import {
  RiArrowRightSLine,
  RiCircleLine,
  RiDashboardLine,
  RiSettings3Line,
  RiInbox2Fill,
  RiBubbleChartFill,
  RiTranslate2,
  RiFontSize2,
  RiPaletteLine,
  RiGlobalLine,
  RiShoppingBag3Line,
  RiAppsLine,
  RiPriceTag3Line,
  RiFunctionLine,
  RiLogoutCircleLine,
  RiUserSettingsLine,
  RiPriceTag2Line,
  RiLayoutTop2Line,
  RiLayoutBottomLine,
  RiMenu2Line,
  RiTranslateAi,
} from 'react-icons/ri';

import { FaLanguage, FaUser } from 'react-icons/fa';

const menu = [
  {
    id: 'group-1',
    title: 'Admin Group',
    menu: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: <RiDashboardLine className="size-5" />,
        route: route('admin.dashboard'),
      },
      {
        id: 'users',
        title: 'Users',
        icon: <FaUser className="size-4" />,
        route: route('users'),
      },
      {
        id: 'role',
        title: 'User Role',
        icon: <RiUserSettingsLine className="size-5" />,
        menu: [
          {
            id: 'view-roles',
            title: 'View Roles',
            route: route('role'),
          },
          {
            id: 'create-role',
            title: 'Create Role',
            route: route('role.create'),
          },
        ],
      },
      {
        id: 'settings',
        title: 'Setting',
        icon: <RiSettings3Line className="size-5" />,
        menu: [
          {
            id: 'site-setting',
            title: 'Site Setting',
            route: route('admin.setting', { type: 'site' }),
            icon: <RiGlobalLine className="size-4" />,
          },
          {
            id: 'font-setting',
            title: 'Font Setting',
            route: route('admin.setting', { type: 'font' }),
            icon: <RiFontSize2 className="size-4" />,
          },
          {
            id: 'color-setting',
            title: 'Color Setting',
            route: route('admin.setting', { type: 'color' }),
            icon: <RiPaletteLine className="size-4" />,
          },
          {
            id: 'backend-color-setting',
            title: 'Backend Color Setting',
            route: route('admin.setting', { type: 'backend-color' }),
            icon: <RiPaletteLine className="size-4" />,
          },
          {
            id: 'transition-setting',
            title: 'Translation',
            route: route('admin.translations'),
            icon: <RiTranslate2 className="size-4" />,
          },
        ],
      },
      {
        id: "language",
        title: "Language",
        icon: <RiTranslateAi className='size-4' />,
        menu: [
          {
            id: "view-language",
            title: "View",
            route: route('admin.lang.index')
          },
          {
            id: "create-language",
            title: 'Create Language',
            route: route('admin.lang.create')
          }
        ]
      }
    ],
  },
  {
    title: 'Post & E-commerce',
    id: 'group-2',
    menu: [
      {
        id: 'product',
        title: 'Product',
        icon: <RiShoppingBag3Line className="size-5" />,
        menu: [
          {
            id: 'add-product',
            title: 'Add Product',
            route: route('post.create', { post: 'product' }),
          },
         
          {
            id: 'view-product',
            title: 'View Product',
            route: route('post.index', {post: 'product'}),
          },
        ],
      },
      {
        id: 'category',
        title: 'Category',
        icon: <RiAppsLine className="size-5" />,
        menu: [
          {
            id: 'category-index',
            title: 'View Categories',
            route: route('category.index'),
          },
          {
            id: 'create-category',
            title: 'Create Category',
            route: route('category.create'),
          },
        ],
      },
      {
        id: 'brand',
        title: 'Brand',
        icon: <RiPriceTag3Line className="size-5" />,
        menu: [
          {
            id: 'brand-index',
            title: 'View Brands',
            route: route('brand.index'),
          },
          {
            id: 'create-brand',
            title: 'Create Brand',
            route: route('brand.create'),
          },
        ],
      },
      {
        id: 'attribute',
        title: 'Attribute',
        icon: <RiFunctionLine className="size-5" />,
        menu: [
          {
            id: 'view-attribute',
            title: 'View Attribute',
            route: route('admin.attributes.index'),
          },
          {
            id: 'create-attribute',
            title: 'Create Attribute',
            route: route('admin.attributes.create')
          }
        ],
      },
      {
        id: 'tag',
        title: 'Tags',
        icon: <RiPriceTag2Line className='size-4' />,
        menu: [
          
          {
            id: 'view-tags',
            route: route('admin.tags.index'),
            title: 'View Tags'
          }
        ]
      }
    ],
  },
  {
    title: 'Layout & Pages',
    id: 'group-3',
    menu: [
      {
        id: "header",
        title: 'Header',
        icon: <RiLayoutTop2Line />,
        route: route('layout.setting', { type: 'header' })
      },
      {
        id: "footer",
        title: 'Footer',
        icon: <RiLayoutBottomLine />
      },
      {
        id: "menu",
        title: 'Menu',
        icon: <RiMenu2Line />,
        route: route('menu.setting')
      },
      {
        id: "home",
        title: 'Home Page',
        icon: <RiBubbleChartFill className="size-5" />,
        route: route('layout.setting', { type: 'home' })
      }
    ]
  }
];

function Sidenav() {
  const { url } = usePage();
  const [open, setOpen] = useState(null);

  useEffect(() => {
    menu.forEach((group) => {
      group.menu.forEach((item) => {
        if (item.menu) {
          item.menu.forEach((sub) => {
            if (url === new URL(sub.route, window.location.origin).pathname) {
              setOpen(item.id);
            }
          });
        } else {
          if (url === new URL(item.route, window.location.origin).pathname) {
            setOpen(null);
          }
        }
      });
    });
  }, [url]);

  const isActive = (itemRoute) =>
    url === new URL(itemRoute, window.location.origin).pathname;

  const toggleMenu = (id) => {
    setOpen(open === id ? null : id);
  };

  return (
    <div className="flex flex-col px-3 gap-7 overflow-y-auto scroll-hidden">
      {menu.map((group) => (
        <div key={group.id} className="gap-3 flex flex-col">
          <span className="text-sm font-medium font-roboto text-secondary px-3">
            {group.title}
          </span>

          <div className="flex w-full flex-col gap-2">
            {group.menu.map((item) => (
              <div className="relative" key={item.id}>
                {item.menu ? (
                  <div
                    onClick={() => toggleMenu(item.id)}
                    className="flex items-center cursor-pointer py-2 relative text-base font-roboto duration-300 hover:bg-[color-mix(in_sRGB,_#e1def5_6%,_#2f3349)] font-medium gap-2 w-full rounded px-3"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    <RiArrowRightSLine
                      className={`absolute size-5 top-1/2 right-3 -translate-y-1/2 transition-transform duration-200 ${open === item.id ? 'rotate-90' : ''
                        }`}
                    />
                  </div>
                ) : (
                  <Link
                    href={item.route}
                    className={`flex duration-300 ${isActive(item.route)
                      ? 'bg-primary text-white'
                      : 'hover:bg-[color-mix(in_sRGB,_#e1def5_6%,_#2f3349)]'
                      } items-center py-2 text-base font-roboto font-medium gap-2 w-full rounded px-3`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )}

                {item.menu && (
                  <div
                    className={`overflow-hidden gap-2 flex flex-col transition-all duration-500 ease-in-out ${open === item.id ? 'max-h-96 my-2' : 'max-h-0'
                      }`}
                  >
                    {item.menu.map((sub) => (
                      <Link
                        key={sub.id}
                        href={sub.route}
                        className={`flex duration-300 hover:bg-[color-mix(in_sRGB,_#e1def5_6%,_#2f3349)] items-center py-2 text-base font-roboto font-medium gap-2 w-full rounded px-3 ${isActive(sub.route) ? 'bg-primary text-white' : ''
                          }`}
                      >
                        <RiCircleLine className="h-3.5 text-secondary w-3.5" />
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

      <Link
        href={route('logout')}
        method="post"
        as="button"
        className="flex items-center cursor-pointer py-2 relative text-base font-roboto duration-300 hover:bg-[color-mix(in_sRGB,_#e1def5_6%,_#2f3349)] font-medium gap-2 w-full rounded px-3"
      >
        <RiLogoutCircleLine className="size-5" />
        <span>Log Out</span>
      </Link>
    </div>
  );
}

export default Sidenav;