import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//Cập nhật giỏ hàng của người dùng
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Người dùng chưa đăng nhập" },
        { status: 401 }
      );
    }
    const { cart } = await request.json();

    // Kiểm tra user có tồn tại không
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Nếu user chưa tồn tại, tạo mới từ Clerk
    if (!user) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        user = await prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name:
              clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : clerkUser.firstName ||
                  clerkUser.lastName ||
                  clerkUser.username ||
                  "User",
            image: clerkUser.imageUrl || "",
            cart: cart || {},
          },
        });
        console.log(`User created: ${userId} - ${user.email}`);
        return NextResponse.json({ message: "Cập nhật giỏ hàng thành công" });
      } catch (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Không thể tạo người dùng. Vui lòng thử lại sau." },
          { status: 500 }
        );
      }
    }

    // User đã tồn tại, cập nhật giỏ hàng
    await prisma.user.update({
      where: { id: userId },
      data: { cart: cart },
    });
    return NextResponse.json({ message: "Cập nhật giỏ hàng thành công" });
  } catch (error) {
    console.error("Error in cart POST:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Người dùng không tồn tại trong hệ thống" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Có lỗi xảy ra khi cập nhật giỏ hàng" },
      { status: 500 }
    );
  }
}

//Lấy giỏ hàng của người dùng
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Người dùng chưa đăng nhập" },
        { status: 401 }
      );
    }

    // Kiểm tra user có tồn tại không
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Nếu user chưa tồn tại, tạo mới từ Clerk
    if (!user) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        user = await prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name:
              clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : clerkUser.firstName ||
                  clerkUser.lastName ||
                  clerkUser.username ||
                  "User",
            image: clerkUser.imageUrl || "",
            cart: {},
          },
        });
        console.log(`User created: ${userId} - ${user.email}`);
      } catch (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Không thể tạo người dùng. Vui lòng thử lại sau." },
          { status: 500 }
        );
      }
    }

    // Đảm bảo cart luôn là object, không phải array
    const cart = user?.cart || {};
    const cartObject = Array.isArray(cart)
      ? {}
      : typeof cart === "object" && cart !== null
      ? cart
      : {};
    return NextResponse.json({ cart: cartObject });
  } catch (error) {
    console.error("Error in cart GET:", error);
    return NextResponse.json(
      { error: error.message || "Có lỗi xảy ra khi lấy giỏ hàng" },
      { status: 500 }
    );
  }
}
