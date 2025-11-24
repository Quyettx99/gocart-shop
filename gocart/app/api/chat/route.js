import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập câu hỏi" },
        { status: 400 }
      );
    }

    // Lấy thông tin về sản phẩm và cửa hàng để AI có context
    const products = await prisma.product.findMany({
      where: { inStock: true },
      select: {
        name: true,
        category: true,
        price: true,
        description: true,
        store: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      take: 20,
    });

    const categories = [...new Set(products.map((p) => p.category))];
    const stores = products.map((p) => p.store.name).filter((v, i, a) => a.indexOf(v) === i);

    // Xây dựng context cho AI
    const systemContext = `Bạn là trợ lý hỗ trợ khách hàng thông minh cho cửa hàng trực tuyến GoCart.
Nhiệm vụ của bạn là trả lời các câu hỏi của khách hàng một cách thân thiện, chuyên nghiệp và hữu ích.

Thông tin về cửa hàng:
- Danh mục sản phẩm có sẵn: ${categories.join(", ")}
- Các cửa hàng: ${stores.join(", ")}

Bạn có thể giúp khách hàng:
1. Tìm kiếm sản phẩm theo danh mục
2. Tư vấn về sản phẩm
3. Hướng dẫn đặt hàng và thanh toán
4. Giải đáp về chính sách vận chuyển, đổi trả
5. Hỗ trợ kỹ thuật

Hãy trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu và thân thiện. Nếu không chắc chắn, hãy đề nghị khách hàng liên hệ qua email hoặc hotline.`;

    // Xây dựng messages cho OpenAI
    const messages = [
      {
        role: "system",
        content: systemContext,
      },
      ...conversationHistory.slice(-10), // Chỉ lấy 10 tin nhắn gần nhất để tránh quá dài
      {
        role: "user",
        content: message,
      },
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content;

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.",
        message: "Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hỗ trợ qua email.",
      },
      { status: 500 }
    );
  }
}

