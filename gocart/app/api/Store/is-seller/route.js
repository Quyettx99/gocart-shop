import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    // Get authenticated user from Clerk (same as other API routes)
    const { userId } = getAuth(request)

    if (!userId) {
      console.log("is-seller: No userId found")
      return NextResponse.json(
        { 
          error: "Not authenticated", 
          message: "Please login to continue",
          hasStore: false,
          isSeller: false
        },
        { status: 401 }
      )
    }

    console.log("is-seller: UserId found:", userId)

    // Get user + store from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { store: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          isSeller: false,
          message: "User not found in database",
        },
        { status: 404 }
      )
    }

    // ✅ 4️⃣ Nếu user chưa có store
    if (!user.store) {
      return NextResponse.json(
        {
          isSeller: false,
          hasStore: false,
          message: "User has no store. Please create one first.",
        },
        { status: 200 }
      )
    }

    // ✅ 5️⃣ Nếu có store → kiểm tra trạng thái
    const storeInfo = user.store
    const isApproved = storeInfo.status === "approved"

    // Serialize storeInfo to avoid Date serialization issues
    const serializedStoreInfo = {
      id: storeInfo.id,
      userId: storeInfo.userId,
      name: storeInfo.name,
      description: storeInfo.description,
      username: storeInfo.username,
      address: storeInfo.address,
      status: storeInfo.status,
      isActive: storeInfo.isActive,
      logo: storeInfo.logo,
      email: storeInfo.email,
      contact: storeInfo.contact,
      createdAt: storeInfo.createdAt?.toISOString(),
      updatedAt: storeInfo.updatedAt?.toISOString(),
    }

    if (!isApproved) {
      return NextResponse.json(
        {
          isSeller: false,
          hasStore: true,
          storeStatus: storeInfo.status,
          storeInfo: serializedStoreInfo,
          message: `Store status is "${storeInfo.status}". Waiting for admin approval.`,
        },
        { status: 200 }
      )
    }

    // ✅ 6️⃣ Trả kết quả khi store đã được duyệt
    return NextResponse.json({
      isSeller: true,
      hasStore: true,
      storeStatus: storeInfo.status,
      storeInfo: serializedStoreInfo,
    })
  } catch (error) {
    console.error("is-seller error:", error)
    console.error("Error stack:", error.stack)
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { 
        error: error.message || "Internal Server Error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
