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
    <div className='flex flex-col gap-6 px-6 pt-5 pb-10'>
      {/* Welcome Banner & Summary Row */}
      <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
        {/* Welcome Card */}
        <div className='md:col-span-8 bg-accent p-6 rounded-2xl relative overflow-hidden shadow-xl border border-white/5'>
          <div className='flex flex-col justify-between h-full max-w-xs relative z-10'>
            <div className='flex flex-col gap-2 w-full'>
              <h4 className="text-xl font-bold text-primary mb-1">
                Congratulations {auth.user.name.split(' ')[0]}! 🎉
              </h4>
              <p className="text-sm text-res font-medium ">You have done 72% more sales today. Check your new badge in your profile.</p>
            </div>
            <div className='mt-8'>
              <h2 className='text-3xl font-bold text-heading mb-3'>$48.9k</h2>
              <button className='bg-primary px-4 py-2 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md shadow-primary/20'>
                VIEW BADGES
              </button>
            </div>
          </div>
          <img
            src={`/storage/uploads/image/dashboard_welcome_illustration_1774264569217.png`}
            className='absolute -bottom-6 -right-6 w-80 opacity-60 md:opacity-100'
            alt="Welcome Illustration"
            onError={(e) => {
              // Fallback if image path is different from storage (sometimes it's from brain directly during dev)
              // This is a safety for this specific agent environment
              // In production, we'd use a fixed asset path.
              if (!e.target.src.includes('brain')) {
                e.target.src = '/brain/f0223f25-1b3d-49cd-a0d7-be7979e0bfb8/dashboard_welcome_illustration_1774264569217.png';
              }
            }}
          />
        </div>

        {/* Small Stat Summary Grid */}
        <div className='md:col-span-4 grid grid-cols-2 gap-4'>
          {data?.main?.slice(0, 4).map((item, key) => (
            <div key={key} className='bg-accent p-5 rounded-2xl border border-white/5 shadow-lg group hover:-translate-y-1 transition-all duration-300'>
              <div className='flex flex-col gap-3'>
                <div className='size-10 rounded-lg flex items-center justify-center bg-primary/10 shadow-inner group-hover:scale-110 transition-transform' style={{ backgroundColor: `${item.color}15` }}>
                  <Icon name={item.icon} className='size-5' style={{ color: item.color, fill: item.color }} />
                </div>
                <div className='flex flex-col'>
                  <h3 className='text-lg font-bold text-heading leading-tight'>{item.counts}</h3>
                  <p className='text-xs font-medium text-res/60 truncate uppercase tracking-wide'>{item.title.split(' ')[0]}</p>
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
            danger: '#ea5455',
            info: '#00cfe8',
            secondary: '#82868b'
          };

          const actualColor = resolvedColors[item.color] || item.color || pieColors.primary;
          const bgGradient = actualColor.replace(')', ', 0.1)'); // Rough gradient for line back

          const chartData = {
            labels: Object.keys(item.counts || {}),
            datasets: [
              {
                label: item.title,
                data: Object.values(item.counts || {}),
                backgroundColor: item.chart === 'pie' || item.chart === 'pie' ? [pieColors.primary, pieColors.success, pieColors.info, pieColors.warning] : actualColor,
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
                  gradient.addColorStop(1, 'rgba(115,103,240,0.15)');
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
                  color: '#acabc1'
                }
              },
              tooltip: {
                backgroundColor: '#2f3349',
                titleColor: '#cfcde4',
                bodyColor: '#cfcde4',
                borderColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: false
              }
            },
            scales: item.chart === 'line' ? {
              x: { display: false },
              y: {
                display: false,
                beginAtZero: true
              }
            } : {
              x: { display: false },
              y: { display: false }
            }
          };

          // const colSpan = item.col === 6 ? 'md:col-span-6' : item.col >= 4 ? 'md:col-span-4' : 'md:col-span-3';

          return (
            <div key={key} className={` bg-accent rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col gap-4 group`} style={{ gridColumn: `${item.col} span / ${item.col} span` }}>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <h3 className='text-heading text-base font-bold group-hover:text-primary transition-colors'>{item.title}</h3>
                  <p className='text-xs text-res opacity-60 font-medium'>{item.description}</p>
                </div>
                {item.chart === 'line' && (
                  <span className='px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-[10px] font-bold'>+12.5%</span>
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
                <div className='flex items-center justify-between mt-2 pt-4 border-t border-white/5'>
                  <div className='flex flex-col'>
                    <span className='text-[10px] text-res/50 font-bold uppercase tracking-wider'>Last Period</span>
                    <span className='text-sm font-bold text-heading'>-2.43%</span>
                  </div>
                  <div className='flex flex-col items-end'>
                    <span className='text-[10px] text-res/50 font-bold uppercase tracking-wider'>Engagement</span>
                    <span className='text-sm font-bold text-heading'>85.4%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── NEW: Recent Products & Quick Actions ── */}
      <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
        
        {/* Recent Products Table */}
        <div className='md:col-span-8 bg-accent rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col'>
          <div className='flex items-center justify-between mb-5'>
            <div>
              <h3 className='text-lg font-bold text-heading'>Recently Added Products</h3>
              <p className='text-xs font-medium text-res opacity-60'>Latest 5 products added to your store.</p>
            </div>
            <Link href={route('post.index', { type: 'product' })} className='text-xs font-bold text-primary hover:underline'>
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-res">
              <thead className="text-xs uppercase bg-bg/50 text-res/70">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Added On</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-res opacity-50 italic">
                      No products found. Add some products to see them here!
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-bg/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-heading">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-md bg-secondary/10 flex items-center justify-center shrink-0">
                            <RiStore2Line className="text-primary size-4" />
                          </div>
                          <span className="truncate max-w-[200px]">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase
                          ${product.status === 'publish' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {product.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs opacity-70">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className='md:col-span-4 flex flex-col gap-4'>
          <div className='bg-accent rounded-2xl p-6 border border-white/5 shadow-lg h-full'>
            <h3 className='text-lg font-bold text-heading mb-1'>Quick Actions</h3>
            <p className='text-xs font-medium text-res opacity-60 mb-5'>Fast access to common tasks</p>
            
            <div className='flex flex-col gap-3'>
              <Link href={route('post.create', { type: 'product' })} className='flex items-center gap-3 p-3 rounded-xl bg-bg/50 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20 group'>
                <div className='p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform'>
                  <RiAddLine size={16} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-bold text-heading group-hover:text-primary transition-colors'>Add New Product</span>
                  <span className='text-xs opacity-60'>Create a new product listing</span>
                </div>
              </Link>
              
              <Link href={route('users')} className='flex items-center gap-3 p-3 rounded-xl bg-bg/50 hover:bg-blue-500/10 hover:text-blue-500 transition-colors border border-transparent hover:border-blue-500/20 group'>
                <div className='p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform'>
                  <RiUser3Line size={16} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-bold text-heading group-hover:text-blue-500 transition-colors'>Manage Users</span>
                  <span className='text-xs text-res opacity-60'>View and edit customer accounts</span>
                </div>
              </Link>

              <Link href={route('admin.setting', { type: 'site' })} className='flex items-center gap-3 p-3 rounded-xl bg-bg/50 hover:bg-orange-500/10 hover:text-orange-500 transition-colors border border-transparent hover:border-orange-500/20 group'>
                <div className='p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform'>
                  <RiSettings3Line size={16} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-bold text-heading group-hover:text-orange-500 transition-colors'>Site Settings</span>
                  <span className='text-xs text-res opacity-60'>Update core website configuration</span>
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
    <AdminLayout>{page}</AdminLayout>
  )
}