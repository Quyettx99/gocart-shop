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
          message: "Not authenticated"
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
        { isSeller: false, hasStore: false, message: "User not found" },
        { status: 404 }
      )
    }

    const store = user.store

    if (!store) {
      return NextResponse.json(
        { isSeller: false, hasStore: false, message: "No store yet" },
        { status: 200 }
      )
    }

    // Convert date fields to ISO
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
          message: "Store waiting for approval",
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
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
