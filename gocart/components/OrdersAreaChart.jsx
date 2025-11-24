'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function OrdersAreaChart({ allOrders }) {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'VND'

    // Nhóm đơn hàng theo ngày và tính tổng doanh thu
    const dataPerDay = allOrders.reduce((acc, order) => {
        // Lấy ngày theo định dạng YYYY-MM-DD
        const date = new Date(order.createdAt).toISOString().split('T')[0]
        
        if (!acc[date]) {
            acc[date] = { orders: 0, revenue: 0 }
        }
        
        acc[date].orders += 1
        acc[date].revenue += order.total
        
        return acc
    }, {})

    // Chuyển object thành array và sắp xếp theo ngày tăng dần
    const chartData = Object.entries(dataPerDay)
        .map(([date, data]) => ({
            date,
            orders: data.orders,
            revenue: data.revenue
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))

    return (
        <div className="w-full max-w-4xl h-[400px] text-xs font-sans">
            <h3 className="text-lg font-medium text-slate-800 mb-4 pt-2 text-right">
                <span className='text-slate-500'>Thống kê /</span> Ngày
            </h3>
            <ResponsiveContainer width="100%" height="100%"> 
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    
                    {/* Trục Y bên trái cho Số đơn hàng */}
                    <YAxis 
                        yAxisId="left" 
                        allowDecimals={false}
                        label={{ value: 'Số đơn hàng', angle: -90, position: 'insideLeft' }} 
                    />
                    
                    {/* Trục Y bên phải cho Doanh thu */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        label={{ value: `Doanh thu (${currency})`, angle: 90,dx:15 , position: 'insideRight' }} 
                    />
                    
                    <Tooltip formatter={(value, name) => [
                        name === 'revenue' ? `${value.toLocaleString('vi-VN')} ${currency}` : value,
                        name === 'revenue' ? 'Doanh thu' : 'Số đơn hàng'
                    ]} />
                    <Legend />
                    
                    {/* Cột hiển thị Số đơn hàng */}
                    <Bar 
                        yAxisId="left" 
                        dataKey="orders" 
                        name="Số đơn hàng" 
                        fill="#4f46e5" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                    />
                    
                    {/* Cột hiển thị Doanh thu */}
                    <Bar 
                        yAxisId="right" 
                        dataKey="revenue" 
                        name="Doanh thu" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}