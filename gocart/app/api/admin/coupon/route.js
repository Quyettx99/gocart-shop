import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

//Thêm coupon mới
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }
    const { coupon } = await request.json();
    //Loại bỏ khoảng trắng và chuyển thành chữ hoa để đồng nhất
    coupon.code = coupon.code.trim().toUpperCase();
    await prisma.coupon
      .create({
        data: coupon,
      })
      .then(async (coupon) => {
        //Chạy Inngest Scheduler để xóa coupon khi hết hạn
        await inngest.send({
          name: "app/coupon.expired",
          data: {
            code: coupon.code,
            expires_at: coupon.expiresAt,
          },
        });
      });
    return NextResponse.json({ message: "Tạo coupon thành công" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

//Xóa coupon /api/coupon?code=couponCode
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");

    //Kiểm tra tham số code
    if (!code) {
      return NextResponse.json(
        { error: "Cần có mã coupon" },
        { status: 400 }
      );
    }

    //Chuyển sang chữ hoa và loại bỏ khoảng trắng
    const upperCode = code.toUpperCase().trim();

    console.log("DELETE coupon - Looking for code:", upperCode);

    //Kiểm tra coupon có tồn tại trước khi xóa
    const coupon = await prisma.coupon.findUnique({
      where: { code: upperCode },
    });

    console.log("DELETE coupon - Found coupon:", coupon ? "Yes" : "No");

    if (!coupon) {
      //Liệt kê tất cả coupon có sẵn để debug
      const allCoupons = await prisma.coupon.findMany({
        select: { code: true },
      });
      console.log(
        "DELETE coupon - Available coupon codes:",
        allCoupons.map((c) => c.code)
      );
      return NextResponse.json(
        { error: `Coupon "${upperCode}" không tồn tại` },
        { status: 404 }
      );
    }

    //Xóa coupon
    await prisma.coupon.delete({
      where: { code: upperCode },
    });

    console.log("DELETE coupon - Successfully deleted:", upperCode);
    return NextResponse.json({ message: "Xóa coupon thành công" });
  } catch (error) {
    console.error("DELETE coupon error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Coupon không tồn tại" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Xóa coupon thất bại" },
      { status: 400 }
    );
  }
}

//Lấy tất cả coupon
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }
    const coupons = await prisma.coupon.findMany({});
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
