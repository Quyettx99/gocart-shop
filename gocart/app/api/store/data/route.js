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
      include: { 
        Product: { 
          include: { rating: true } 
        } 
      },
    });

    if (!store) {
        return NextResponse.json({ error: "Không tìm thấy cửa hàng" }, { status: 400 });
    }

    // Tính đánh giá trung bình từ tất cả các sản phẩm
    let totalRating = 0;
    let totalRatingsCount = 0;
    
    store.Product.forEach((product) => {
      if (product.rating && product.rating.length > 0) {
        product.rating.forEach((rating) => {
          totalRating += rating.rating;
          totalRatingsCount += 1;
        });
      }
    });

    const averageRating = totalRatingsCount > 0 
      ? (totalRating / totalRatingsCount).toFixed(1) 
      : 0;

    // Tính số lượng sản phẩm đã bán (từ OrderItem)
    const soldProducts = await prisma.orderItem.findMany({
      where: {
        product: {
          storeId: store.id,
        },
      },
      select: {
        quantity: true,
      },
    });

    const totalSold = soldProducts.reduce((sum, item) => sum + item.quantity, 0);

    // Thêm thông tin vào store object
    const storeWithStats = {
      ...store,
      averageRating: parseFloat(averageRating),
      totalRatings: totalRatingsCount,
      totalSold: totalSold,
    };

    return NextResponse.json({ store: storeWithStats });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message || "Lỗi máy chủ" },
      { status: 400 }
    );
  }
}
