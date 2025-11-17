import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Thêm đánh giá mới
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { orderId, productId, rating, review } = await request.json();

    const order = await prisma.order.findUnique({ where: { id: orderId, userId } });
    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const isAlreadyRated = await prisma.rating.findFirst({ where: { orderId, productId } });
    if (isAlreadyRated) {
      return NextResponse.json({ error: "Sản phẩm đã được đánh giá" }, { status: 400 });
    }

    const response = await prisma.rating.create({
      data: { userId, productId, rating, review, orderId },
    });

    return NextResponse.json({ message: "Đã thêm đánh giá thành công", rating: response });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message || "Có lỗi xảy ra" }, { status: 400 });
  }
}

// Lấy tất cả đánh giá của người dùng
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Chưa xác thực" }, { status: 401 });
    }

    const ratings = await prisma.rating.findMany({ where: { userId } });
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message || "Có lỗi xảy ra" }, { status: 400 });
  }
}
