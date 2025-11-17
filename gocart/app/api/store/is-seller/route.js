import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { userId } = getAuth(request)

    if (!userId) {
      return NextResponse.json(
        { 
          isSeller: false,
          hasStore: false,
          message: "Chưa đăng nhập"
        },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { store: true },
    })

    if (!user) {
      return NextResponse.json(
        { isSeller: false, hasStore: false, message: "Không tìm thấy người dùng" },
        { status: 404 }
      )
    }

    const store = user.store

    if (!store) {
      return NextResponse.json(
        { isSeller: false, hasStore: false, message: "Chưa có cửa hàng" },
        { status: 200 }
      )
    }

    // Chuyển date sang ISO
    const storeInfo = {
      ...store,
      createdAt: store.createdAt?.toISOString(),
      updatedAt: store.updatedAt?.toISOString(),
    }

    if (store.status !== "approved") {
      return NextResponse.json(
        {
          isSeller: false,
          hasStore: true,
          storeStatus: store.status,
          storeInfo,
          message: "Cửa hàng đang chờ phê duyệt",
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      isSeller: true,
      hasStore: true,
      storeStatus: store.status,
      storeInfo,
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    )
  }
}
