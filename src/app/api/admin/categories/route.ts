import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase"; // ◀ 追加

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "カテゴリ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// カテゴリの新規作成
export async function POST(req: NextRequest) {
  // Bearer トークンから実際のトークンを取り出す
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    const category = await prisma.category.create({
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "カテゴリの作成に失敗しました" },
      { status: 500 }
    );
  }
}
