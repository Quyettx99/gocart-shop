import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
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

    //Lưu giỏ hàng vào object user
    await prisma.user.update({
      where: { id: userId },
      data: { cart: cart },
    });
    return NextResponse.json({ message: "Cập nhật giỏ hàng thành công" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return NextResponse.json({ cart: user?.cart || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
