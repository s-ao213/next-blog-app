// import prisma from "@/lib/prisma";
// import { NextResponse, NextRequest } from "next/server";
// import { Post } from "@prisma/client";

// type RequestBody = {
//   title: string;
//   content: string;
//   coverImageURL: string;
//   categoryIds: string[];
// };

// export const POST = async (req: NextRequest) => {
//   try {
//     const requestBody: RequestBody = await req.json();

//     // 分割代入
//     const { title, content, coverImageURL, categoryIds } = requestBody;

//     // categoryIds で指定されるカテゴリがDB上に存在するか確認
//     const categories = await prisma.category.findMany({
//       where: {
//         id: {
//           in: categoryIds,
//         },
//       },
//     });
//     if (categories.length !== categoryIds.length) {
//       return NextResponse.json(
//         { error: "指定されたカテゴリのいくつかが存在しません" },
//         { status: 400 } // 400: Bad Request
//       );
//     }

//     // 投稿記事テーブルにレコードを追加
//     const post: Post = await prisma.post.create({
//       data: {
//         title, // title: title の省略形であることに注意。以下も同様
//         content,
//         coverImageURL,
//       },
//     });

//     // 中間テーブルにレコードを追加
//     for (const categoryId of categoryIds) {
//       await prisma.postCategory.create({
//         data: {
//           postId: post.id,
//           categoryId: categoryId,
//         },
//       });
//     }

//     return NextResponse.json(post);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "投稿記事の作成に失敗しました" },
//       { status: 500 }
//     );
//   }
// };

// app/api/admin/posts/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";

type RequestBody = {
  title: string;
  content: string;
  coverImageURL: string;
  categoryIds: string[];
};

export async function GET(req: NextRequest) {
  try {
    // 投稿一覧を取得（カテゴリ情報も含める）
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

    // クライアントの型定義に合わせてデータを整形
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      coverImage: {
        url: post.coverImageURL,
        width: 800, // これらは実際の画像サイズに応じて動的に設定する必要があります
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
  try {
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
        { error: "指定されたカテゴリのいくつかが存在しません" },
        { status: 400 }
      );
    }

    // トランザクションを使用して投稿とカテゴリの関連付けを一括で行う
    const newPost = await prisma.$transaction(async (tx) => {
      // 投稿を作成
      const post = await tx.post.create({
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

    // クライアントの型定義に合わせてレスポンスを整形
    const formattedPost = {
      id: newPost.id,
      title: newPost.title,
      content: newPost.content,
      coverImage: {
        url: newPost.coverImageURL,
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
