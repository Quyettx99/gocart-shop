import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Lấy danh sách sản phẩm và danh mục để AI có context
    const products = await prisma.product.findMany({
      where: { inStock: true },
      select: {
        name: true,
        category: true,
        description: true,
      },
      take: 50, // Giới hạn để không quá nặng
    });

    const categories = [...new Set(products.map((p) => p.category))];

    const messages = [
      {
        role: "system",
        content: `Bạn là trợ lý tìm kiếm thông minh cho cửa hàng trực tuyến.
Nhiệm vụ của bạn là phân tích truy vấn tìm kiếm của người dùng và đề xuất 3-5 từ khóa tìm kiếm liên quan bằng tiếng Việt.

Trả về CHỈ JSON thuần (không có markdown, không có code block, không giải thích).
Định dạng JSON:
{
  "suggestions": ["từ khóa 1", "từ khóa 2", "từ khóa 3"]
}

Các gợi ý phải:
- Ngắn gọn (1-3 từ)
- Liên quan đến truy vấn
- Phù hợp với sản phẩm thương mại điện tử
- Bằng tiếng Việt`,
      },
      {
        role: "user",
        content: `Người dùng đang tìm kiếm: "${query}"

Danh mục sản phẩm có sẵn: ${categories.join(", ")}

Hãy đề xuất 3-5 từ khóa tìm kiếm liên quan.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 150,
    });

    const raw = response.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      // Nếu AI không trả về JSON hợp lệ, tạo gợi ý đơn giản dựa trên query
      const simpleSuggestions = [
        query,
        `${query} giá rẻ`,
        `${query} chất lượng`,
      ].slice(0, 3);
      return NextResponse.json({ suggestions: simpleSuggestions });
    }

    return NextResponse.json({
      suggestions: parsed.suggestions || [],
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    // Trả về mảng rỗng nếu có lỗi
    return NextResponse.json({ suggestions: [] });
  }
}
