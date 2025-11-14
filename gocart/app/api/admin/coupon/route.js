import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

//add new coupon
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { coupon } = await request.json();
    // Trim and convert to uppercase to ensure consistency
    coupon.code = coupon.code.trim().toUpperCase();
    await prisma.coupon
      .create({
        data: coupon,
      })
      .then(async (coupon) => {
        //Run Inngest Sheduler function to delete coupon on expire
        await inngest.send({
          name: "app/coupon.expired",
          data: {
            code: coupon.code,
            expires_at: coupon.expiresAt,
          },
        });
      });
    return NextResponse.json({ message: "Coupon created successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

//Delete coupon /api/coupon?code=couponCode
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");

    // Validate code parameter
    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Convert to uppercase and trim whitespace to match database (same as POST handler)
    const upperCode = code.toUpperCase().trim();

    console.log("DELETE coupon - Looking for code:", upperCode);

    // Check if coupon exists before deleting
    const coupon = await prisma.coupon.findUnique({
      where: { code: upperCode },
    });

    console.log("DELETE coupon - Found coupon:", coupon ? "Yes" : "No");

    if (!coupon) {
      // List all available coupons for debugging
      const allCoupons = await prisma.coupon.findMany({
        select: { code: true },
      });
      console.log(
        "DELETE coupon - Available coupon codes:",
        allCoupons.map((c) => c.code)
      );
      return NextResponse.json(
        { error: `Coupon "${upperCode}" not found` },
        { status: 404 }
      );
    }

    // Delete the coupon
    await prisma.coupon.delete({
      where: { code: upperCode },
    });

    console.log("DELETE coupon - Successfully deleted:", upperCode);
    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("DELETE coupon error:", error);
    // Handle Prisma specific errors
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 400 }
    );
  }
}

//get all coupons
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
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
