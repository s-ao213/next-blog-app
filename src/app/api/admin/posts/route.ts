// route.ts
import { supabase } from "@/utils/supabase";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化

type RequestBody = {
  title: string;
  content: string;
  coverImageKey: string;
  categoryIds: string[];
  shopName?: string;
  businessHours?: string;
  phoneNumber?: string;
};

export async function GET(req: NextRequest) {
  try {
    const posts = await prisma.post.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      coverImage: {
        key: post.coverImageKey, // ◀ Changed from coverImageURL
        width: 800,
        height: 600,
      },
      categories: post.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // URLからpostIdを取得
  const url = new URL(req.url);
  const postId = url.searchParams.get("id");

  if (!postId) {
    return NextResponse.json(
      { error: "投稿IDが指定されていません" },
      { status: 400 }
    );
  }

  try {
    // まず投稿が存在するか確認
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: "指定された投稿が見つかりません" },
        { status: 404 }
      );
    }

    // トランザクションを使用して、関連するカテゴリーの関連付けも削除
    await prisma.$transaction(async (tx) => {
      // まず、PostCategoryの関連付けを削除
      await tx.postCategory.deleteMany({
        where: { postId },
      });

      // 次に、投稿自体を削除
      await tx.post.delete({
        where: { id: postId },
      });
    });

    return NextResponse.json({ message: "投稿を削除しました" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿の削除に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });
  try {
    const requestBody: RequestBody = await req.json();
    const {
      title,
      content,
      coverImageKey,
      categoryIds,
      shopName = "",
      businessHours = "",
      phoneNumber = "",
    } = requestBody;

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "指定されたカテゴリのいくつかが存在しません" },
        { status: 400 }
      );
    }

    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title,
          content,
          coverImageKey,
          shopName,
          businessHours,
          phoneNumber,
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

    const formattedPost = {
      id: newPost.id,
      title: newPost.title,
      content: newPost.content,
      coverImage: {
        key: newPost.coverImageKey,
        width: 800,
        height: 600,
      },
      categories: newPost.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),
      shopName: newPost.shopName,
      businessHours: newPost.businessHours,
      phoneNumber: newPost.phoneNumber,
      createdAt: newPost.createdAt.toISOString(),
      updatedAt: newPost.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の作成に失敗しました" },
      { status: 500 }
    );
  }
}
