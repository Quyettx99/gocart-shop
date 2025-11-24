import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cập nhật trạng thái đơn hàng của người bán
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
    }

    const { orderId, status } = await request.json();

      const upperCaseStatus = status.toUpperCase();
    await prisma.order.update({
      where: { id: orderId, storeId },
      data: { status:upperCaseStatus },
    });

    return NextResponse.json({ message: "Cập nhật trạng thái đơn hàng thành công" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// Lấy tất cả đơn hàng của người bán
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        user: true,
        address: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}