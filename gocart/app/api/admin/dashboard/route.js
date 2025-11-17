import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

//Lấy dữ liệu dashboard cho admin (tổng số người dùng, tổng số cửa hàng, tổng số sản phẩm, tổng doanh thu)
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "Không có quyền" }, { status: 401 })
        }

        //Lấy tổng số đơn hàng
        const orders = await prisma.order.count()

        //Lấy tổng số cửa hàng trên app
        const stores = await prisma.store.count()

        //Lấy tất cả đơn hàng (chỉ lấy createdAt và total) và tính tổng doanh thu
        const allOrders = await prisma.order.findMany({
            select: { createdAt: true, total: true }
        })

        let totalRevenue = 0
        allOrders.forEach(order => {
            totalRevenue += order.total
        })
        const revenue = totalRevenue.toFixed(2)

        //Tổng số sản phẩm trên app
        const products = await prisma.product.count()

        const dashboardData = {
            orders,
            stores,
            products,
            revenue,
            allOrders
        }

        return NextResponse.json({ dashboardData })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
