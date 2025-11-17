import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import imagekit from "@/configs/imageKit";

// Tạo cửa hàng mới
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    // Lấy dữ liệu từ request
    const formData = await request.formData();
    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin cửa hàng" },
        { status: 400 }
      );
    }

    // Kiểm tra người dùng đã có cửa hàng chưa
    const store = await prisma.store.findFirst({
      where: { userId }
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    // Kiểm tra tên đăng nhập cửa hàng đã tồn tại chưa
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() }
    });
    if (isUsernameTaken) {
      return NextResponse.json(
        { error: "Tên đăng nhập cửa hàng đã được sử dụng" },
        { status: 400 }
      );
    }

    // Upload logo lên ImageKit
    const buffer = Buffer.from(await image.arrayBuffer());
    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    // Tạo cửa hàng mới
    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImageUrl,
      },
    });

    return NextResponse.json({
      message: "Đã gửi yêu cầu, đang chờ phê duyệt",
      storeId: newStore.id
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// Kiểm tra người dùng đã đăng ký cửa hàng chưa
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const store = await prisma.store.findFirst({
      where: { userId }
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    return NextResponse.json({ status: "chưa đăng ký" });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
