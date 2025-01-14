// import prisma from "@/lib/prisma";
// import { NextResponse, NextRequest } from "next/server";
// import { Category } from "@prisma/client";

// type RequestBody = {
//   name: string;
// };

// export const POST = async (req: NextRequest) => {
//   try {
//     const { name }: RequestBody = await req.json();
//     const category: Category = await prisma.category.create({
//       data: {
//         name,
//       },
//     });
//     return NextResponse.json(category);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "カテゴリの作成に失敗しました" },
//       { status: 500 }
//     );
//   }
// };
// app/api/admin/categories/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

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

// カテゴリの新規作成用（必要に応じて）
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    const category = await prisma.category.create({
      data: {
        name,
      },
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
