// [id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化

type RouteParams = {
  params: {
    id: string;
  };
};

type RequestBody = {
  title: string;
  content: string;
  coverImageKey: string;
  categoryIds: string[];
  shopName: string;
  businessHours: string;
  phoneNumber: string;
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
      coverImage: {
        key: post.coverImageKey, // ◀ Changed from coverImageURL
        width: 800,
        height: 600,
      },
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
    const {
      title,
      content,
      coverImageKey,
      categoryIds,
      shopName,
      businessHours,
      phoneNumber,
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
        { error: "指定されたカテゴリが存在しません" },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      await tx.postCategory.deleteMany({
        where: { postId: id },
      });

      const post = await tx.post.update({
        where: { id },
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
      ...updatedPost,
      coverImage: {
        key: updatedPost.coverImageKey, // ◀ Changed from coverImageURL
        width: 800,
        height: 600,
      },
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
