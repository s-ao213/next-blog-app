// import prisma from "@/lib/prisma";
// import { NextResponse, NextRequest } from "next/server";
// import { Post } from "@prisma/client";

// export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化

// export const GET = async (req: NextRequest) => {
//   try {
//     const posts = await prisma.post.findMany({
//       select: {
//         id: true,
//         title: true,
//         content: true,
//         coverImageKey: true,
//         createdAt: true,
//         categories: {
//           select: {
//             category: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });
//     return NextResponse.json(posts);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "投稿記事の一覧の取得に失敗しました" },
//       { status: 500 }
//     );
//   }
// };
// src/app/api/posts/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        coverImageKey: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "投稿記事が見つかりませんでした" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の取得に失敗しました" },
      { status: 500 }
    );
  }
};
