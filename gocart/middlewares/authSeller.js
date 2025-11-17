import prisma from "@/lib/prisma";

const authSeller = async (clerkUserId) => {
  try {
    if (!clerkUserId) {
      console.log('Auth Seller - Không có userId được cung cấp');
      return false;
    }

    // Tìm user trong database bằng clerkUserId
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId }, // Clerk userId lưu trực tiếp trong User.id
      include: { store: true },
    });

    if (!user) {
      console.log('Auth Seller - Không tìm thấy user trong database:', clerkUserId);
      return false;
    }

    console.log('Auth Seller - User được tìm thấy:', {
      id: user.id,
      name: user.name,
      email: user.email,
      hasStore: !!user.store,
      storeStatus: user.store?.status || 'no-store',
    });

    if (!user.store) {
      console.log('Auth Seller - User chưa có cửa hàng. Cần tạo cửa hàng trước.');
      return false;
    }

    if (user.store.status !== "approved") {
      console.log('Auth Seller - Cửa hàng đã tồn tại nhưng chưa được duyệt. Trạng thái hiện tại:', user.store.status);
      return false;
    }

    // Cửa hàng đã được duyệt
    return user.store.id; // Trả về storeId
  } catch (error) {
    console.error('Auth Seller Lỗi:', error);
    return false;
  }
}

export default authSeller;
