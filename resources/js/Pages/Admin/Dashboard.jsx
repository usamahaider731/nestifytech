import AdminLayout from '@/Layouts/AdminLayout'
import React, { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import {
  Chart as ChartJS,
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
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  RiShoppingBag3Line,
  RiUser3Line,
  RiStore2Line,
  RiMoneyDollarCircleLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiAddLine,
  RiSettings3Line,
  RiBankCardLine,
  RiPaypalLine,
  RiMore2Fill,
  RiCheckboxCircleFill,
  RiTimeLine,
  RiTrophyLine
} from 'react-icons/ri'

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
)

function Dashboard({ data, ecommerce }) {
  const { auth } = usePage().props
  const availableYears = ecommerce?.available_years
  const [reportYear, setReportYear] = useState(ecommerce?.selected_year?.toString() || '2026')
  const [reportTab, setReportTab] = useState('all') // 'all' | 'earnings' | 'expenses'
  const handleYearChange = (year) => {
    setReportYear(year)
    router.get(route('admin.dashboard'), { year }, { preserveState: true, preserveScroll: true, replace: true })
  }
  const stats = ecommerce?.stats || {
    sales: { value: '0', label: 'Sales', change: '+0.0%', is_positive: true, color: '#7367f0' },
    customers: { value: '0', label: 'Customers', change: '+0.0%', is_positive: true, color: '#00bad1' },
    products: { value: '0', label: 'Products', change: '+0.0%', is_positive: true, color: '#ff4c51' },
    revenue: { value: '$0', label: 'Revenue', change: '+0.0%', is_positive: true, color: '#28c76f' },
  }
  const congratulations = ecommerce?.congratulations || {}
  const profitSummary = ecommerce?.profit_summary || {}
  const revenueReport = ecommerce?.revenue_report || {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    earnings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    expenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    budget: '$50,000',
    budget_growth: '+0.0%',
    spent_ratio: '0%',
    deposit: '$0'
  }

  const popularProducts = ecommerce?.popular_products || []
  const recentOrders = ecommerce?.recent_orders || []
  const categoriesChart = ecommerce?.categories_chart || {
    labels: ['Smartphones', 'Laptops', 'Audio', 'Accessories'],
    series: [45, 28, 18, 9],
    total_units: 100
  }
  const revenueChartData = {
    labels: revenueReport.months,
    datasets: [
      ...(reportTab === 'all' || reportTab === 'earnings' ? [{
        label: 'Earnings',
        data: revenueReport.earnings,
        backgroundColor: '#7367f0',
        borderRadius: 6,
        barThickness: 12,
      }] : []),
      ...(reportTab === 'all' || reportTab === 'expenses' ? [{
        label: 'Expenses',
        data: revenueReport.expenses,
        backgroundColor: '#00bad1',
        borderRadius: 6,
        barThickness: 12,
      }] : []),
    ]
  }
  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#2f3349',
        titleColor: '#e1def5',
        bodyColor: '#e1def5',
        borderColor: '#434968',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: $${context.raw?.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#828699', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#828699',
          font: { size: 11 },
          callback: (value) => `$${value / 1000}k`
        }
      }
    }
  }
  const profitSparkline = {
    labels: profitSummary.profit_sparkline?.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{
      data: profitSummary.profit_sparkline?.data || [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#28c76f',
      borderWidth: 2.5,
      tension: 0.45,
      pointRadius: 0,
      fill: true,
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return 'transparent'
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
        gradient.addColorStop(0, 'rgba(40, 199, 111, 0)')
        gradient.addColorStop(1, 'rgba(40, 199, 111, 0.25)')
        return gradient
      }
    }]
  }
  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
  const expensesSparkline = {
    labels: profitSummary.expenses_sparkline?.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [{
      data: profitSummary.expenses_sparkline?.data || [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#ff9f43',
      borderWidth: 2.5,
      tension: 0.45,
      pointRadius: 0,
      fill: true,
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return 'transparent'
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
        gradient.addColorStop(0, 'rgba(255, 159, 67, 0)')
        gradient.addColorStop(1, 'rgba(255, 159, 67, 0.22)')
        return gradient
      }
    }]
  }
  const doughnutColors = ['#7367f0', '#28c76f', '#00bad1', '#ff9f43', '#ff4c51']
  const doughnutData = {
    labels: categoriesChart.labels,
    datasets: [{
      data: categoriesChart.series,
      backgroundColor: doughnutColors,
      borderWidth: 0,
      cutout: '76%'
    }]
  }
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2f3349',
        titleColor: '#e1def5',
        bodyColor: '#e1def5',
        borderColor: '#434968',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    }
  }
  return (
    <div className='flex flex-col gap-6 pt-3 pb-12 font-sans'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        <div className='lg:col-span-4 bg-accent p-6 rounded relative overflow-hidden shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between group'>
          <div className='relative z-10 flex flex-col gap-2 max-w-[240px]'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-primary'>eCommerce Champion</span>
            <h3 className='text-lg font-semibold text-heading tracking-tight leading-snug'>
              Congratulations {auth?.user?.name ? auth.user.name.split(' ')[0] : 'Admin'}! 🎉
            </h3>
            <p className='text-xs text-secondary leading-relaxed'>
              {congratulations.message || `Store performance is trending up! You achieved ${stats.revenue.change} revenue growth this month.`}
            </p>
          </div>
          <div className='relative z-10 mt-6 pt-4 border-t border-permanent/20 flex items-center justify-between'>
            <div>
              <span className='text-2xl font-black text-heading tracking-tight'>{stats.revenue.value}</span>
              <p className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${stats.revenue.is_positive !== false ? 'text-green-400' : 'text-red-400'}`}>
                {stats.revenue.is_positive !== false ? <RiArrowRightUpLine size={12} /> : <RiArrowRightDownLine size={12} />}
                {congratulations.achievement_percentage || stats.revenue.change} of target
              </p>
            </div>
            <Link
              href={route('post.index', { type: 'product' })}
              className='bg-primary hover:bg-[#685dd8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_0_rgba(115,103,240,0.4)] hover:shadow-[0_6px_16px_0_rgba(115,103,240,0.5)] cursor-pointer'
            >
              View Sales
            </Link>
          </div>
          <div className='absolute right-2 top-4 size-13 pointer-events-none select-none opacity-90 group-hover:scale-105 transition-transform duration-500'>
            <div className='relative w-full h-full flex items-center justify-center'>
              <div className='absolute inset-0 bg-primary/20 blur-2xl rounded-full' />
              <div className='size-13 rounded bg-gradient-to-tr from-[#7367f0] to-[#9e95f5] flex items-center justify-center shadow-xl rotate-12 group-hover:rotate-6 transition-transform'>
                <RiTrophyLine className='size-8 text-white -rotate-12 group-hover:-rotate-6 transition-transform' />
              </div>
            </div>
          </div>
        </div>
        <div className='lg:col-span-8 bg-accent p-6 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h4 className='text-base font-bold text-heading'>Statistics</h4>
              <p className='text-xs text-secondary'>Updated in real-time • Store performance overview</p>
            </div>
            <span className='text-[11px] font-semibold text-secondary bg-bg/60 px-3 py-1 rounded-full border border-permanent/20'>
              Live Tracking
            </span>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2'>
            <div className='flex items-center gap-2.5 p-2 rounded-xl bg-bg/30 border border-permanent/10 hover:border-primary/30 transition-all'>
              <div className='size-10 rounded-xl bg-[#7367f0]/15 text-[#7367f0] flex items-center justify-center shrink-0 shadow-sm'>
                <RiShoppingBag3Line size={18} />
              </div>
              <div className='flex flex-col'>
                <h4 className='text-base font-extrabold text-heading leading-tight'>{stats.sales.value}</h4>
                <span className='text-xs text-secondary font-medium'>{stats.sales.label}</span>
                <span className={`text-[10px] font-bold mt-0.25 flex items-center gap-0.5 ${stats.sales.is_positive !== false ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.sales.is_positive !== false ? <RiArrowRightUpLine size={10} /> : <RiArrowRightDownLine size={10} />}
                  {stats.sales.change}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2.5 p-2 rounded-xl bg-bg/30 border border-permanent/10 hover:border-[#00bad1]/30 transition-all'>
              <div className='size-10 rounded-xl bg-[#00bad1]/15 text-[#00bad1] flex items-center justify-center shrink-0 shadow-sm'>
                <RiUser3Line size={18} />
              </div>
              <div className='flex flex-col'>
                <h4 className='text-base font-extrabold text-heading leading-tight'>{stats.customers.value}</h4>
                <span className='text-xs text-secondary font-medium'>{stats.customers.label}</span>
                <span className={`text-[10px] font-bold mt-0.25 flex items-center gap-0.5 ${stats.customers.is_positive !== false ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.customers.is_positive !== false ? <RiArrowRightUpLine size={10} /> : <RiArrowRightDownLine size={10} />}
                  {stats.customers.change}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2.5 p-2 rounded-xl bg-bg/30 border border-permanent/10 hover:border-[#ff4c51]/30 transition-all'>
              <div className='size-10 rounded-xl bg-[#ff4c51]/15 text-[#ff4c51] flex items-center justify-center shrink-0 shadow-sm'>
                <RiStore2Line size={18} />
              </div>
              <div className='flex flex-col'>
                <h4 className='text-base font-extrabold text-heading leading-tight'>{stats.products.value}</h4>
                <span className='text-xs text-secondary font-medium'>{stats.products.label}</span>
                <span className={`text-[10px] font-bold mt-0.25 flex items-center gap-0.5 ${stats.products.is_positive !== false ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.products.is_positive !== false ? <RiArrowRightUpLine size={10} /> : <RiArrowRightDownLine size={10} />}
                  {stats.products.change}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2.5 p-2 rounded-xl bg-bg/30 border border-permanent/10 hover:border-[#28c76f]/30 transition-all'>
              <div className='size-10 rounded-xl bg-[#28c76f]/15 text-[#28c76f] flex items-center justify-center shrink-0 shadow-sm'>
                <RiMoneyDollarCircleLine size={18} />
              </div>
              <div className='flex flex-col'>
                <h4 className='text-base font-extrabold text-heading leading-tight'>{stats.revenue.value}</h4>
                <span className='text-xs text-secondary font-medium'>{stats.revenue.label}</span>
                <span className={`text-[10px] font-bold mt-0.25 flex items-center gap-0.5 ${stats.revenue.is_positive !== false ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.revenue.is_positive !== false ? <RiArrowRightUpLine size={10} /> : <RiArrowRightDownLine size={10} />}
                  {stats.revenue.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        <div className='lg:col-span-8 bg-accent p-6 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between'>
          <div className='flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-permanent/20'>
            <div>
              <h4 className='text-base font-bold text-heading'>Revenue Report</h4>
              <p className='text-xs text-secondary'>Monthly earnings versus operational expenses</p>
            </div>

            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-1 bg-bg/50 p-1 rounded-xl border border-permanent/20 text-xs font-semibold text-secondary'>
                <button
                  onClick={() => setReportTab('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${reportTab === 'all' ? 'bg-primary text-white shadow-xs' : 'hover:text-heading'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setReportTab('earnings')}
                  className={`px-3 py-1 rounded-lg transition-all ${reportTab === 'earnings' ? 'bg-[#7367f0] text-white shadow-xs' : 'hover:text-heading'}`}
                >
                  Earning
                </button>
                <button
                  onClick={() => setReportTab('expenses')}
                  className={`px-3 py-1 rounded-lg transition-all ${reportTab === 'expenses' ? 'bg-[#00bad1] text-white shadow-xs' : 'hover:text-heading'}`}
                >
                  Expense
                </button>
              </div>

              <select
                value={reportYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className='bg-bg/50 border border-permanent/20 text-heading text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer'
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-6 pt-5'>
            <div className='md:col-span-8 h-64 relative'>
              <Bar data={revenueChartData} options={revenueChartOptions} />
            </div>
            <div className='md:col-span-4 flex flex-col justify-between pl-0 md:pl-5 border-t md:border-t-0 md:border-l border-permanent/20 pt-4 md:pt-0'>
              <div className='flex flex-col gap-4'>
                <div className='text-center md:text-left'>
                  <span className='text-xs font-bold uppercase tracking-wider text-secondary'>Budget Status</span>
                  <div className='flex items-baseline gap-2 mt-1'>
                    <h3 className='text-2xl font-black text-heading'>{revenueReport.budget}</h3>
                    <span className='text-xs font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full'>
                      {revenueReport.budget_growth}
                    </span>
                  </div>
                  <p className='text-xs text-secondary mt-1'>Budget allocated for marketing & logistics</p>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <div className='flex justify-between text-xs font-semibold'>
                    <span className='text-secondary'>Spent Ratio</span>
                    <span className='text-primary font-bold'>{revenueReport.spent_ratio || '0%'}</span>
                  </div>
                  <div className='w-full bg-bg/60 h-2 rounded-full overflow-hidden border border-permanent/20'>
                    <div
                      className='bg-primary h-full rounded-full transition-all duration-500'
                      style={{ width: revenueReport.spent_ratio || '0%' }}
                    />
                  </div>
                </div>
                <div className='p-3.5 rounded-xl bg-bg/40 border border-permanent/10 flex flex-col gap-1'>
                  <span className='text-[11px] text-secondary font-medium'>Deposit Received</span>
                  <span className='text-lg font-bold text-heading'>{revenueReport.deposit}</span>
                </div>
              </div>
              <Link
                href={route('post.index', { type: 'product' })}
                className='w-full text-center mt-4 bg-primary hover:bg-[#685dd8] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-[0_3px_10px_0_rgba(115,103,240,0.35)]'
              >
                Increase Budget
              </Link>
            </div>
          </div>
        </div>
        <div className='lg:col-span-4 flex flex-col gap-6'>
          <div className='bg-accent p-5 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between h-full'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex flex-col'>
                <span className='text-xs font-bold uppercase tracking-wider text-secondary'>Profit Margin</span>
                <div className='flex items-baseline gap-2 mt-1'>
                  <h3 className='text-2xl font-black text-heading'>{profitSummary.total_profit || '$0'}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${profitSummary.profit_is_positive !== false ? 'text-green-400 bg-green-500/15' : 'text-red-400 bg-red-500/15'}`}>
                    {profitSummary.profit_is_positive !== false ? <RiArrowRightUpLine size={12} /> : <RiArrowRightDownLine size={12} />}
                    {profitSummary.profit_change || '+0.0%'}
                  </span>
                </div>
              </div>
              <div className='size-10 rounded-xl bg-green-500/15 text-green-400 flex items-center justify-center shadow-xs'>
                <RiMoneyDollarCircleLine size={20} />
              </div>
            </div>
            <div className='h-20 w-full mt-2'>
              <Line data={profitSparkline} options={miniChartOptions} />
            </div>
          </div>
          <div className='bg-accent p-5 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between h-full'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex flex-col'>
                <span className='text-xs font-bold uppercase tracking-wider text-secondary'>Total Expenses</span>
                <div className='flex items-baseline gap-2 mt-1'>
                  <h3 className='text-2xl font-black text-heading'>{profitSummary.total_expenses || '$0'}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${profitSummary.expenses_is_positive ? 'text-orange-400 bg-orange-500/15' : 'text-green-400 bg-green-500/15'}`}>
                    {profitSummary.expenses_is_positive ? <RiArrowRightUpLine size={12} /> : <RiArrowRightDownLine size={12} />}
                    {profitSummary.expenses_change || '+0.0%'}
                  </span>
                </div>
              </div>
              <div className='size-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shadow-xs'>
                <RiShoppingBag3Line size={20} />
              </div>
            </div>
            <div className='h-20 w-full mt-2'>
              <Line data={expensesSparkline} options={miniChartOptions} />
            </div>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        <div className='lg:col-span-8 bg-accent p-6 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h4 className='text-base font-bold text-heading'>Top Selling Products</h4>
              <p className='text-xs text-secondary'>Products with the highest customer velocity & inventory status</p>
            </div>
            <Link
              href={route('post.index', { type: 'product' })}
              className='text-xs font-bold text-primary hover:underline flex items-center gap-1'
            >
              View All <RiArrowRightUpLine size={14} />
            </Link>
          </div>
          <div className='overflow-x-auto rounded-xl border border-permanent/20'>
            <table className='w-full text-left text-xs text-res'>
              <thead className='bg-bg/60 text-secondary uppercase font-semibold text-[10px] tracking-wider border-b border-permanent/20'>
                <tr>
                  <th className='px-3 py-3.5'>Product</th>
                  <th className='px-2 py-3.5'>Category</th>
                  <th className='px-3 py-3.5'>Stock</th>
                  <th className='px-3 py-3.5'>Price</th>
                  <th className='px-3 py-3.5 text-right'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-permanent/10 w-full overflow-x-auto'>
                {popularProducts.length === 0 ? (
                  <tr>
                    <td colSpan='5' className='px-4 py-8 text-center text-secondary italic'>
                      No products found. Start adding products to populate analytics!
                    </td>
                  </tr>
                ) : (
                  popularProducts.map((prod, idx) => (
                    <tr key={idx} className='hover:bg-dynamic/40 transition-colors'>
                      <td className='px-3 py-3 font-semibold text-heading'>
                        <div className='flex items-center gap-3'>
                          {prod.image ? (
                            <img src={prod.image} alt={prod.title} className='size-8 rounded-lg object-cover shrink-0' />
                          ) : (
                            <div className='size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold'>
                              {prod.title ? prod.title.charAt(0).toUpperCase() : 'P'}
                            </div>
                          )}
                          <div className='flex flex-col max-w-[150px] truncate'>
                            <span className='truncate font-bold text-heading hover:text-primary transition-colors'>
                              {prod.title}
                            </span>
                            <div className='flex items-center gap-1.5'>
                              <span className='text-[10px] text-secondary font-mono'>{prod.sku || 'NST-ITEM'}</span>
                              {prod.sales_count > 0 && (
                                <span className='text-[9px] font-bold text-primary bg-primary/10 px-1 rounded'>
                                  {prod.sales_count} sold
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-2 py-3 items-center'>
                        <span className='px-2.5 py-1 flex rounded-full text-[8px] font-semibold bg-bg/80 w-fit text-secondary border text-center items-center justify-center border-permanent/20'>
                          {prod.category}
                        </span>
                      </td>
                      <td className='px-3 py-3'>
                        <span className={`px-2 py-1 items-center justify-center rounded-full flex text-[9px] font-semibold ${prod.stock > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                          {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className='px-3 py-3 font-semibold text-heading'>
                        ${prod.price ? prod.price.toLocaleString() : '0.00'}
                      </td>
                      <td className='px-3 py-3 text-right'>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${prod.status === 'publish' ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
                          {prod.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Statistics (Doughnut Chart + Legend Breakdown) */}
        <div className='lg:col-span-4 bg-accent p-6 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between'>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <h4 className='text-base font-bold text-heading'>Order Statistics</h4>
              <p className='text-xs text-secondary'>Catalog distribution by category</p>
            </div>
            <button className='text-secondary hover:text-heading transition-colors'>
              <RiMore2Fill size={18} />
            </button>
          </div>

          {/* Central Cutout Doughnut Chart */}
          <div className='relative h-56 w-full flex items-center justify-center my-3'>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className='absolute flex flex-col items-center pointer-events-none'>
              <span className='text-2xl font-black text-heading tracking-tight'>{categoriesChart.total_units || stats.sales.value}</span>
              <span className='text-[10px] font-bold uppercase tracking-wider text-secondary'>Total Units</span>
            </div>
          </div>

          {/* Categories Legend List */}
          <div className='flex flex-col gap-2.5 pt-3 border-t border-permanent/20'>
            {categoriesChart.labels.slice(0, 5).map((label, idx) => (
              <div key={idx} className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-2'>
                  <span className='size-2.5 rounded-full' style={{ backgroundColor: doughnutColors[idx % doughnutColors.length] }} />
                  <span className='font-semibold text-heading'>{label}</span>
                </div>
                <span className='text-secondary font-semibold font-mono'>
                  {categoriesChart.series[idx]} units
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ROW 4: Recent Transactions & Quick Admin Actions ── */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>

        {/* Recent Transactions List */}
        <div className='lg:col-span-8 bg-accent p-6 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h4 className='text-base font-bold text-heading'>Transactions</h4>
              <p className='text-xs text-secondary'>Latest customer payments and settlement orders</p>
            </div>
            <span className='text-xs font-bold text-primary'>Realtime Stream</span>
          </div>

          <div className='flex flex-col divide-y divide-permanent/10'>
            {recentOrders.length === 0 ? (
              <div className='py-8 text-center text-xs text-secondary italic'>
                No transactions recorded yet.
              </div>
            ) : (
              recentOrders.map((ord, idx) => (
                <div key={idx} className='py-3.5 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-dynamic/20 px-2 rounded-xl transition-colors'>
                  <div className='flex items-center gap-3.5'>
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${ord.method?.toLowerCase().includes('paypal') ? 'bg-[#00bad1]/15 text-[#00bad1]' : 'bg-[#7367f0]/15 text-[#7367f0]'}`}>
                      {ord.method?.toLowerCase().includes('paypal') ? (
                        <RiPaypalLine size={20} />
                      ) : (
                        <RiBankCardLine size={20} />
                      )}
                    </div>
                    <div className='flex flex-col'>
                      <span className='font-bold text-heading text-xs'>{ord.customer}</span>
                      <span className='text-[10px] text-secondary'>{ord.method} • {ord.date}</span>
                    </div>
                  </div>

                  <div className='flex items-center gap-4'>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ord.status === 'completed' || ord.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
                      {ord.status}
                    </span>
                    <span className='text-sm font-extrabold text-heading font-mono'>
                      +${ord.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Admin Actions (Vuexy Shortcuts) */}
        <div className='lg:col-span-4 bg-accent p-6 rounded shadow-[0_4px_18px_0_rgba(15,20,34,0.36)] border border-permanent/30 flex flex-col justify-between'>
          <div>
            <h4 className='text-base font-bold text-heading mb-1'>Quick Actions</h4>
            <p className='text-xs text-secondary mb-4'>Immediate access to store workflows</p>

            <div className='flex flex-col gap-2.5'>
              <Link
                href={route('post.create', { type: 'product' })}
                className='flex items-center gap-3.5 p-3 rounded-xl bg-bg/40 hover:bg-primary/10 hover:border-primary/40 border border-permanent/20 transition-all group'
              >
                <div className='size-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center group-hover:scale-105 transition-transform'>
                  <RiAddLine size={18} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-bold text-heading group-hover:text-primary transition-colors'>Add New Product</span>
                  <span className='text-[10px] text-secondary'>Create listings with variants and stock</span>
                </div>
              </Link>

              <Link
                href={route('users')}
                className='flex items-center gap-3.5 p-3 rounded-xl bg-bg/40 hover:bg-[#00bad1]/10 hover:border-[#00bad1]/40 border border-permanent/20 transition-all group'
              >
                <div className='size-9 rounded-lg bg-[#00bad1]/15 text-[#00bad1] flex items-center justify-center group-hover:scale-105 transition-transform'>
                  <RiUser3Line size={18} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-bold text-heading group-hover:text-[#00bad1] transition-colors'>Manage Customers</span>
                  <span className='text-[10px] text-secondary'>Inspect users, roles and privileges</span>
                </div>
              </Link>

              <Link
                href={route('admin.setting', { type: 'site' })}
                className='flex items-center gap-3.5 p-3 rounded-xl bg-bg/40 hover:bg-[#ff9f43]/10 hover:border-[#ff9f43]/40 border border-permanent/20 transition-all group'
              >
                <div className='size-9 rounded-lg bg-[#ff9f43]/15 text-[#ff9f43] flex items-center justify-center group-hover:scale-105 transition-transform'>
                  <RiSettings3Line size={18} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-bold text-heading group-hover:text-[#ff9f43] transition-colors'>Store Settings</span>
                  <span className='text-[10px] text-secondary'>Configure payment, taxes and branding</span>
                </div>
              </Link>
            </div>
          </div>

          <div className='mt-5 pt-4 border-t border-permanent/20 flex items-center justify-between text-xs text-secondary font-medium'>
            <span className='flex items-center gap-1.5'>
              <RiCheckboxCircleFill className='text-green-400 size-4' /> All systems operational
            </span>
            <span className='text-[11px] font-mono'>v3.1.0</span>
          </div>
        </div>

      </div>

    </div>
  )
}

export default Dashboard

Dashboard.layout = (page) => {
  return (
    <AdminLayout title="eCommerce Dashboard">{page}</AdminLayout>
  )
}