import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase"; // ◀ 追加

type RouteParams = {
  params: {
    id: string;
  };
};

type RequestBody = {
  title: string;
  content: string;
  coverImageURL: string;
  categoryIds: string[];
};

export async function GET(req: NextRequest, routeParams: RouteParams) {
  try {
    const id = routeParams.params.id;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "投稿が見つかりません" },
        { status: 404 }
      );
    }

    // クライアントに必要な形式に整形
    const formattedPost = {
      ...post,
      categories: post.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, routeParams: RouteParams) {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });
  try {
    const id = routeParams.params.id;
    const requestBody: RequestBody = await req.json();
    const { title, content, coverImageURL, categoryIds } = requestBody;

    // カテゴリの存在確認
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "指定されたカテゴリが存在しません" },
        { status: 400 }
      );
    }

    // トランザクションを使用して更新処理を実行
    const updatedPost = await prisma.$transaction(async (tx) => {
      // 中間テーブルのレコードを削除
      await tx.postCategory.deleteMany({
        where: { postId: id },
      });

      // 投稿を更新
      const post = await tx.post.update({
        where: { id },
        data: {
          title,
          content,
          coverImageURL,
          categories: {
            create: categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return post;
    });

    // クライアントに必要な形式に整形
    const formattedPost = {
      ...updatedPost,
      categories: updatedPost.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, routeParams: RouteParams) {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });
  try {
    const id = routeParams.params.id;

    // 投稿の存在確認
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "投稿が見つかりません" },
        { status: 404 }
      );
    }

    // トランザクションを使用して削除処理を実行
    await prisma.$transaction(async (tx) => {
      // 中間テーブルのレコードを削除
      await tx.postCategory.deleteMany({
        where: { postId: id },
      });

      // 投稿を削除
      await tx.post.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: `「${existingPost.title}」を削除しました。`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿の削除に失敗しました" },
      { status: 500 }
    );
  }
}
