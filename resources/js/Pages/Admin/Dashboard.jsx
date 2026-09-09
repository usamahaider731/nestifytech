import AdminLayout from '@/Layouts/AdminLayout'
import React, { useEffect, useState } from 'react'
import Icon from '@/Components/Icon'
import { Link, usePage } from '@inertiajs/react'
import axios from 'axios'
// chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { RiAddLine, RiStore2Line, RiSettings3Line, RiUser3Line } from 'react-icons/ri';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ data }) {
  const { auth } = usePage().props;
  const [resolvedColors, setResolvedColors] = useState({});
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    // Fetch recent products for the dashboard table
    axios.get('/api/get_posts?type=product&limit=5')
      .then(res => setRecentProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      document.body.appendChild(tempDiv);
      const newColors = {};
      data?.chart?.forEach((item) => {
        if (item.color && item.color.includes('var(')) {
          tempDiv.style.color = item.color;
          newColors[item.color] = getComputedStyle(tempDiv).color;
        }
      });
      document.body.removeChild(tempDiv);
      setResolvedColors(newColors);
    }
  }, [data]);

  return (
    <div className='flex flex-col gap-6 pt-3 pb-10'>
      {/* Welcome Banner & Summary Row */}
      <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
        {/* Vuexy Welcome Card */}
        <div className='md:col-span-8 bg-accent p-6 rounded-xl relative overflow-hidden shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/40'>
          <div className='flex flex-col justify-between h-full max-w-sm relative z-10'>
            <div className='flex flex-col gap-2 w-full'>
              <h4 className="text-xl font-bold text-primary tracking-tight mb-0.5">
                Congratulations {auth.user.name.split(' ')[0]}! 🎉
              </h4>
              <p className="text-xs text-res font-medium leading-relaxed">Best seller of the month. You have achieved 72% more sales today. Check your badge in your profile.</p>
            </div>
            <div className='mt-6'>
              <div className='flex items-baseline gap-2 mb-3'>
                <h2 className='text-3xl font-extrabold text-heading tracking-tight'>$48.9k</h2>
                <span className='text-xs font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full'>+18.2%</span>
              </div>
              <button className='bg-primary px-4 py-2 text-white text-xs font-semibold rounded-lg hover:bg-[#685dd8] transition-all shadow-[0_2px_6px_0_rgba(115,103,240,0.48)] cursor-pointer'>
                View Badges
              </button>
            </div>
          </div>
          <div className='absolute -bottom-2 -right-2 w-64 h-48 opacity-20 md:opacity-30 pointer-events-none flex items-end justify-end text-primary'>
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="150" cy="150" r="100" fill="url(#violetGlow)" />
              <path d="M120 70L160 110L140 160L90 140Z" fill="currentColor" fillOpacity="0.4" />
              <circle cx="100" cy="80" r="25" fill="#7367f0" fillOpacity="0.5" />
              <defs>
                <radialGradient id="violetGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 150) rotate(90) scale(100)">
                  <stop stopColor="#7367f0" stopOpacity="0.8"/>
                  <stop offset="1" stopColor="#7367f0" stopOpacity="0"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Vuexy Small Stat Summary Grid */}
        <div className='md:col-span-4 grid grid-cols-2 gap-4'>
          {data?.main?.slice(0, 4).map((item, key) => (
            <div key={key} className='bg-accent p-4 rounded-xl border border-permanent/40 shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] group hover:-translate-y-0.5 transition-all duration-300'>
              <div className='flex flex-col gap-3'>
                <div className='size-10 rounded-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform' style={{ backgroundColor: `${item.color || '#7367f0'}20` }}>
                  <Icon name={item.icon} className='size-5' style={{ color: item.color || '#7367f0', fill: item.color || '#7367f0' }} />
                </div>
                <div className='flex flex-col'>
                  <h3 className='text-lg font-bold text-heading leading-tight'>{item.counts}</h3>
                  <p className='text-[11px] font-semibold text-secondary truncate uppercase tracking-wider'>{item.title.split(' ')[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts & Analytics */}
      <div className='grid grid-cols-10 gap-6'>
        {data?.chart?.map((item, key) => {
          const pieColors = {
            primary: '#7367f0',
            success: '#28c76f',
            warning: '#ff9f43',
            danger: '#ff4c51',
            info: '#00bad1',
            secondary: '#7983a7'
          };

          const actualColor = resolvedColors[item.color] || item.color || pieColors.primary;

          const chartData = {
            labels: Object.keys(item.counts || {}),
            datasets: [
              {
                label: item.title,
                data: Object.values(item.counts || {}),
                borderColor: actualColor,
                borderWidth: item.chart === 'line' ? 3 : 0,
                tension: 0.45,
                fill: item.chart === 'line',
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: actualColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3,
                backgroundColor: (context) => {
                  if (item.chart !== 'line') return item.is_line ? actualColor : [pieColors.primary, pieColors.success, pieColors.info, pieColors.warning];
                  const chart = context.chart;
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return null;
                  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                  gradient.addColorStop(0, 'rgba(115,103,240,0)');
                  gradient.addColorStop(1, 'rgba(115,103,240,0.18)');
                  return gradient;
                },
                cutout: item.chart === 'pie' ? '75%' : 0,
              },
            ],
          };

          const chartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: item.chart === 'pie',
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle',
                  boxWidth: 8,
                  padding: 20,
                  font: { size: 12, weight: '500', family: "'Public Sans', sans-serif" },
                  color: '#b6bee3'
                }
              },
              tooltip: {
                backgroundColor: '#2f3349',
                titleColor: '#d0d4f1',
                bodyColor: '#d0d4f1',
                borderColor: '#434968',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: false
              }
            },
            scales: item.chart === 'line' ? {
              x: { display: false },
              y: { display: false, beginAtZero: true }
            } : {
              x: { display: false },
              y: { display: false }
            }
          };

          return (
            <div key={key} className={`bg-accent rounded-xl p-5 border border-permanent/40 shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] flex flex-col gap-4 group`} style={{ gridColumn: `${item.col} span / ${item.col} span` }}>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <h3 className='text-heading text-base font-bold group-hover:text-primary transition-colors'>{item.title}</h3>
                  <p className='text-xs text-secondary font-medium'>{item.description}</p>
                </div>
                {item.chart === 'line' && (
                  <span className='px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold'>+12.5%</span>
                )}
              </div>
              <div className="w-full h-48 relative">
                {item.chart === 'line' ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Doughnut data={chartData} options={chartOptions} />
                )}
              </div>
              {item.chart !== 'pie' && (
                <div className='flex items-center justify-between mt-2 pt-3 border-t border-permanent/30'>
                  <div className='flex flex-col'>
                    <span className='text-[10px] text-secondary font-bold uppercase tracking-wider'>Last Period</span>
                    <span className='text-xs font-bold text-heading'>-2.43%</span>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span className='text-[10px] text-secondary font-bold uppercase tracking-wider'>Engagement</span>
                    <span className='text-xs font-bold text-heading'>85.4%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent Products & Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
        
        {/* Recent Products Table */}
        <div className='md:col-span-8 bg-accent rounded-xl p-5 border border-permanent/40 shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] flex flex-col'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-base font-bold text-heading'>Recently Added Products</h3>
              <p className='text-xs font-medium text-secondary'>Latest products added to your store.</p>
            </div>
            <Link href={route('post.index', { type: 'product' })} className='text-xs font-bold text-primary hover:underline'>
              View All
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-permanent/30">
            <table className="w-full text-left text-sm text-res">
              <thead className="text-[11px] uppercase bg-bg/60 text-secondary font-semibold border-b border-permanent/30">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Added On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-permanent/20">
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-secondary italic text-xs">
                      No products found. Add some products to see them here!
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-dynamic/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-heading text-xs">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 text-primary">
                            <RiStore2Line className="size-4" />
                          </div>
                          <span className="truncate max-w-[220px] font-semibold">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase
                          ${product.status === 'publish' ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
                          {product.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-secondary font-medium">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vuexy Quick Actions Panel */}
        <div className='md:col-span-4 flex flex-col gap-4'>
          <div className='bg-accent rounded-xl p-5 border border-permanent/40 shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] h-full'>
            <h3 className='text-base font-bold text-heading mb-0.5'>Quick Actions</h3>
            <p className='text-xs font-medium text-secondary mb-4'>Fast access to common admin tasks</p>
            
            <div className='flex flex-col gap-2.5'>
              <Link href={route('post.create', { type: 'product' })} className='flex items-center gap-3 p-3 rounded-xl bg-bg/40 hover:bg-primary/10 hover:text-primary transition-all border border-permanent/20 hover:border-primary/40 group cursor-pointer'>
                <div className='p-2 rounded-lg bg-primary/15 text-primary group-hover:scale-110 transition-transform'>
                  <RiAddLine size={16} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-bold text-heading group-hover:text-primary transition-colors'>Add New Product</span>
                  <span className='text-[11px] text-secondary'>Create a new product listing</span>
                </div>
              </Link>
              
              <Link href={route('users')} className='flex items-center gap-3 p-3 rounded-xl bg-bg/40 hover:bg-blue-500/10 hover:text-blue-400 transition-all border border-permanent/20 hover:border-blue-500/40 group cursor-pointer'>
                <div className='p-2 rounded-lg bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform'>
                  <RiUser3Line size={16} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-bold text-heading group-hover:text-blue-400 transition-colors'>Manage Users</span>
                  <span className='text-[11px] text-secondary'>View and edit customer accounts</span>
                </div>
              </Link>

              <Link href={route('admin.setting', { type: 'site' })} className='flex items-center gap-3 p-3 rounded-xl bg-bg/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all border border-permanent/20 hover:border-orange-500/40 group cursor-pointer'>
                <div className='p-2 rounded-lg bg-orange-500/15 text-orange-400 group-hover:scale-110 transition-transform'>
                  <RiSettings3Line size={16} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-bold text-heading group-hover:text-orange-400 transition-colors'>Site Settings</span>
                  <span className='text-[11px] text-secondary'>Update core configuration</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
Dashboard.layout = (page) => {
  return (
    <AdminLayout title="Dashboard">{page}</AdminLayout>
  )
}