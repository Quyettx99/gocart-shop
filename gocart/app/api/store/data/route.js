import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Lấy thông tin cửa hàng & sản phẩm của cửa hàng
export async function GET(request) {
  try {
    // Lấy username cửa hàng từ query params
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.toLowerCase();
    if (!username) {
        return NextResponse.json({ error: "Thiếu tên đăng nhập cửa hàng" }, { status: 400 });
    }

    // Lấy thông tin cửa hàng và các sản phẩm còn trong kho kèm đánh giá
    const store = await prisma.store.findFirst({
      where: { username, isActive: true },
      include: { Product: { include: { rating: true } } },
    });

    if (!store) {
        return NextResponse.json({ error: "Không tìm thấy cửa hàng" }, { status: 400 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message || "Lỗi máy chủ" },
      { status: 400 }
    );
  }
}
