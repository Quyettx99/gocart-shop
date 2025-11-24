import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const { addressId, items, couponCode, paymentMethod } =
      await request.json();

    //Kiểm tra các trường bắt buộc
    if (
      !addressId ||
      !items ||
      items.length === 0 ||
      !paymentMethod ||
      !Array.isArray(items)
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (!coupon) {
        return NextResponse.json(
          { error: "Mã giảm giá không tồn tại" },
          { status: 400 }
        );
      }
    }

    //Kiểm tra coupon chỉ áp dụng cho người dùng mới
    if (couponCode && coupon.forNewUser) {
      const userorders = await prisma.order.findMany({ where: { userId } });
      if (userorders.length > 0) {
        return NextResponse.json(
          { error: "Mã giảm giá chỉ áp dụng cho người dùng mới" },
          { status: 404 }
        );
      }
    }
    const isPlusMember = has({ plan: "plus" });

    //Kiểm tra coupon chỉ áp dụng cho thành viên
    if (couponCode && coupon.forMember) {
      if (!isPlusMember) {
        return NextResponse.json(
          { error: "Mã giảm giá chỉ áp dụng cho thành viên" },
          { status: 400 }
        );
      }
    }

    //Kiểm tra tồn kho của tất cả sản phẩm
    const outOfStockProducts = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { id: true, name: true, inStock: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Sản phẩm với ID ${item.id} không tồn tại` },
          { status: 404 }
        );
      }

      if (!product.inStock) {
        outOfStockProducts.push(product.name || product.id);
      }
    }

    //Nếu có sản phẩm hết hàng, trả về lỗi
    if (outOfStockProducts.length > 0) {
      return NextResponse.json(
        {
          error: `Các sản phẩm sau đã hết hàng: ${outOfStockProducts.join(
            ", "
          )}. Vui lòng xóa chúng khỏi giỏ hàng.`,
        },
        { status: 400 }
      );
    }

    //Nhóm các sản phẩm theo storeId
    const ordersByStore = new Map();
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
      });
      const storeId = product.storeId;
      if (!ordersByStore.has(storeId)) {
        ordersByStore.set(storeId, []);
      }
      ordersByStore.get(storeId).push({ ...item, price: product.price });
    }
    let orderIds = [];
    let fullAmount = 0;
    let isShippingFeeAdded = false;

    //Tạo đơn hàng cho từng cửa hàng
    for (const [storeId, sellerItems] of ordersByStore.entries()) {
      let total = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      if (couponCode) {
        total -= (total * coupon.discount) / 100;
      }
      if (!isPlusMember && !isShippingFeeAdded) {
        total += 20000;
        isShippingFeeAdded = true;
      }
      fullAmount += parseFloat(total.toFixed(2));
      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total: parseFloat(total.toFixed(2)),
          paymentMethod,
          isCouponUsed: coupon ? true : false,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      orderIds.push(order.id);
    }

    if (paymentMethod === "STRIPE") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const origin = await request.headers.get("origin");
      const currency = "vnd";
      const zeroDecimalCurrencies = [
        "bif",
        "clp",
        "djf",
        "gnf",
        "jpy",
        "kmf",
        "krw",
        "mga",
        "pyg",
        "rwf",
        "vnd",
        "vuv",
        "xaf",
        "xof",
        "xpf",
      ];
      const unitAmount = zeroDecimalCurrencies.includes(currency)
        ? Math.round(fullAmount)
        : Math.round(fullAmount * 100);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: "Thanh toán đơn hàng",
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //thời gian hiện tại + 30 phút
        mode: "payment",
        success_url: `${origin}/loading?nextUrl=orders`,
        cancel_url: `${origin}/cart`,
        metadata: { orderIds: orderIds.join(","), userId, appId: "gocart" },
      });
      return NextResponse.json({ session });
    }
    if (couponCode) {
      await prisma.coupon.update({
        where: { code: couponCode },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }

    //Xóa giỏ hàng
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });
    return NextResponse.json({ message: "Đặt hàng thành công" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

//Lấy tất cả đơn hàng của user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const orders = await prisma.order.findMany({
      where: {
        userId,
        OR: [
          { paymentMethod: PaymentMethod.COD },
          { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] },
        ],
      },
      include: {
        orderItems: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
