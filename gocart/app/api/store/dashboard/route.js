import authSeller from '@/middlewares/authSeller';
import { NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';

// Lấy dữ liệu bảng điều khiển cho người bán (tổng đơn hàng, tổng doanh thu, tổng sản phẩm)
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json(
                { error: "Người dùng không phải là người bán hoặc chưa có cửa hàng" },
                { status: 401 }
            );
        }

        // Lấy tất cả đơn hàng của người bán
        const orders = await prisma.order.findMany({
            where: { storeId }
        });

        // Lấy tất cả sản phẩm kèm đánh giá của người bán
        const products = await prisma.product.findMany({
            where: { storeId }
        });

        const ratings = await prisma.rating.findMany({
            where: { productId: { in: products.map((product) => product.id) } },
            include: { user: true, product: true }
        });

        const dashboardData = {
            ratings, // danh sách đánh giá
            totalOrders: orders.length, // tổng đơn hàng
            totalEarnings: Math.round(
                orders.reduce((acc, order) => acc + order.total, 0)
            ), // tổng doanh thu
            totalProducts: products.length // tổng sản phẩm
        };

        return NextResponse.json({ dashboardData });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message || "Lỗi máy chủ" },
            { status: 400 }
        );
    }
}
