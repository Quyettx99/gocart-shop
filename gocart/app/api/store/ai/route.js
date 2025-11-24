import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";

async function main(base64Image, mimeType) {
  const messages = [
    {
      role: "system",
      content: `You are a product listing assistant for an e-commerce store serving Vietnamese merchants.
      Your job is to analyze an image of a product and generate structured data **in Vietnamese** only.

      Respond ONLY with raw JSON (no code block, no markdown, no explanation).
      The JSON must strictly follow this schema: 

      {
        "name": string,               // Tên sản phẩm ngắn bằng tiếng Việt
        "description": string         // Mô tả marketing-friendly bằng tiếng Việt
      }`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this image and return name + description.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages,
  });

  const raw = response.choices[0].message.content;

  // loại bỏ ```json hoặc ``` nếu có
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error("AI không trả về JSON hợp lệ");
  }
  return parsed;
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json(
        { error: "Không có quyền thực hiện" },
        { status: 401 }
      );
    }

    const { base64Image, mimeType } = await request.json();
    const result = await main(base64Image, mimeType);
    return NextResponse.json({ ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message || "Có lỗi xảy ra" },
      { status: 400 }
    );
  }
}
