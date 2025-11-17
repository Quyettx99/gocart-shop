import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

//Bật/tắt trạng thái isActive của cửa hàng
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
        }

        const { storeId } = await request.json();
        if (!storeId) {
            return NextResponse.json({ error: "Thiếu storeId" }, { status: 400 });
        }
       
        //Tìm cửa hàng
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });
        if (!store) {
            return NextResponse.json({ error: "Không tìm thấy cửa hàng" }, { status: 404 });
        }

        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive }
        });

        return NextResponse.json({ message: "Cập nhật cửa hàng thành công" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
