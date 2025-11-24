import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Đảm bảo route chạy trong Node.js runtime
export const runtime = "nodejs";

// Kiểm tra trạng thái tồn kho của nhiều sản phẩm
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Request body không hợp lệ" },
        { status: 400 }
      );
    }

    const { productIds } = body || {};

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: "Danh sách ID sản phẩm không hợp lệ" },
        { status: 400 }
      );
    }

    // Nếu mảng rỗng, trả về kết quả rỗng
    if (productIds.length === 0) {
      return NextResponse.json({ stockStatus: {} });
    }

    // Lọc bỏ các giá trị null/undefined và trùng lặp, chỉ lấy string
    const validProductIds = [...new Set(
      productIds
        .filter(id => id != null && id !== "" && typeof id === "string")
        .slice(0, 100) // Giới hạn tối đa 100 sản phẩm
    )];

    if (validProductIds.length === 0) {
      return NextResponse.json({ stockStatus: {} });
    }

    // Lấy thông tin tồn kho và chi tiết của các sản phẩm
    let products = [];
    try {
      products = await prisma.product.findMany({
        where: {
          id: { in: validProductIds },
        },
        select: {
          id: true,
          inStock: true,
          name: true,
          price: true,
          images: true,
          category: true,
        },
      });
    } catch (dbError) {
      console.error("Database error in check-stock:", dbError);
      throw dbError;
    }

    // Tạo map để dễ tra cứu
    const stockStatus = {};
    products.forEach((product) => {
      stockStatus[product.id] = {
        inStock: product.inStock,
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category,
      };
    });

    return NextResponse.json({ stockStatus });
  } catch (error) {
    console.error("Error in check-stock API:", error);
    return NextResponse.json(
      { 
        error: "Có lỗi xảy ra khi kiểm tra tồn kho",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

