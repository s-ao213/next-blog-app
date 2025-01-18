// route.ts
import { supabase } from "@/utils/supabase";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";

type RequestBody = {
  title: string;
  content: string;
  coverImageKey: string; // ◀ Changed from coverImageURL
  categoryIds: string[];
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

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });
  try {
    const requestBody: RequestBody = await req.json();
    const { title, content, coverImageKey, categoryIds } = requestBody; // ◀ Changed from coverImageURL

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
          coverImageKey, // ◀ Changed from coverImageURL
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
        key: newPost.coverImageKey, // ◀ Changed from coverImageURL
        width: 800,
        height: 600,
      },
      categories: newPost.categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),
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
