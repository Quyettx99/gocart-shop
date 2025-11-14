import prisma from "@/lib/prisma";

const authSeller = async (clerkUserId) => {
  try {
    if (!clerkUserId) {
      console.log('Auth Seller - No userId provided');
      return false;
    }

    // Tìm user trong database bằng clerkUserId
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId }, // Clerk userId được lưu trực tiếp trong User.id
      include: { store: true },
    });

    if (!user) {
      console.log('Auth Seller - User not found in database:', clerkUserId);
      return false;
    }

    console.log('Auth Seller - User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      hasStore: !!user.store,
      storeStatus: user.store?.status || 'no-store',
    });

    if (!user.store) {
      console.log('Auth Seller - User has no store. User needs to create a store first.');
      return false;
    }

    if (user.store.status !== "approved") {
      console.log('Auth Seller - Store exists but status is not approved. Current status:', user.store.status);
      return false;
    }

    // Store is approved
    return user.store.id; // Trả về storeId
  } catch (error) {
    console.error('Auth Seller Error:', error);
    return false;
  }
}

export default authSeller;