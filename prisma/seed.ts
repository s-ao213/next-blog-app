// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// const main = async () => {
//   // 既存のレコードを全て削除
//   await prisma.postCategory?.deleteMany();
//   await prisma.post?.deleteMany();
//   await prisma.category?.deleteMany();

//   // カテゴリデータの作成 (レコードのInsert)
//   const c1 = await prisma.category.create({ data: { name: "カテゴリ1" } });
//   const c2 = await prisma.category.create({ data: { name: "カテゴリ2" } });
//   const c3 = await prisma.category.create({ data: { name: "カテゴリ3" } });
//   const c4 = await prisma.category.create({ data: { name: "カテゴリ4" } });

//   // 投稿記事データの作成 (レコードのInsert)
//   const p1 = await prisma.post.create({
//     data: {
//       title: "投稿1",
//       content: "投稿1の本文。<br/>投稿1の本文。投稿1の本文。",
//       coverImageKey: "cover-img-red.jpg",
//       categories: {
//         create: [{ categoryId: c1.id }, { categoryId: c2.id }],
//       },
//     },
//   });

//   const p2 = await prisma.post.create({
//     data: {
//       title: "投稿2",
//       content: "投稿2の本文。<br/>投稿2の本文。投稿2の本文。",
//       coverImageKey: "cover-img-green.jpg",
//       categories: {
//         create: [{ categoryId: c2.id }, { categoryId: c3.id }],
//       },
//     },
//   });

//   const p3 = await prisma.post.create({
//     data: {
//       title: "投稿3",
//       content: "投稿3の本文。<br/>投稿3の本文。投稿3の本文。",
//       coverImageKey: "cover-img-yellow.jpg",
//       categories: {
//         create: [
//           { categoryId: c1.id },
//           { categoryId: c3.id },
//           { categoryId: c4.id },
//         ],
//       },
//     },
//   });

//   const p4 = await prisma.post.create({
//     data: {
//       title: "投稿4",
//       content: "投稿4の本文。<br/>投稿4の本文。投稿4の本文。",
//       coverImageKey: "cover-img-purple.jpg",
//       categories: {
//         create: [],
//       },
//     },
//   });

//   console.log(JSON.stringify(p1, null, 2));
//   console.log(JSON.stringify(p2, null, 2));
//   console.log(JSON.stringify(p3, null, 2));
//   console.log(JSON.stringify(p4, null, 2));
// };

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  // 既存のレコードを全て削除
  await prisma.postCategory?.deleteMany();
  await prisma.post?.deleteMany();
  await prisma.category?.deleteMany();

  // カテゴリデータの作成 (レコードのInsert)
  const c1 = await prisma.category.create({ data: { name: "プリン" } });
  const c2 = await prisma.category.create({ data: { name: "カフェ" } });
  const c3 = await prisma.category.create({ data: { name: "洋菓子店" } });
  const c4 = await prisma.category.create({ data: { name: "スイーツ" } });

  // 投稿記事データの作成 (レコードのInsert)
  const p1 = await prisma.post.create({
    data: {
      title: "絶品プリンを求めて！渋谷のおすすめカフェ",
      content:
        "渋谷にある隠れた名店で、絶品プリンを堪能してきました。<br/>濃厚でなめらかな食感に感動！",
      coverImageKey: "cover-img-pudding1.jpg",
      shopName: "渋谷スイーツカフェ",
      businessHours: "11:00-20:00 (定休日：火曜日)",
      phoneNumber: "03-1234-5678",
      categories: {
        create: [
          { category: { connect: { id: c1.id } } },
          { category: { connect: { id: c2.id } } },
        ],
      },
    },
  });

  const p2 = await prisma.post.create({
    data: {
      title: "老舗洋菓子店のプリンは本当に美味しいのか？",
      content:
        "歴史ある洋菓子店で人気のプリンを食べ比べ。<br/>伝統と革新が融合した味わいに驚きました！",
      coverImageKey: "cover-img-pudding2.jpg",
      shopName: "銀座クラシックスイーツ",
      businessHours: "10:00-19:30 (定休日：水曜日)",
      phoneNumber: "03-9876-5432",
      categories: {
        create: [
          { category: { connect: { id: c2.id } } },
          { category: { connect: { id: c3.id } } },
        ],
      },
    },
  });

  const p3 = await prisma.post.create({
    data: {
      title: "話題の新店！極上プリンの世界",
      content:
        "最近オープンした話題の店で、革新的なプリンを堪能。<br/>見た目も味も絶品の逸品でした。",
      coverImageKey: "cover-img-pudding3.jpg",
      shopName: "モダンプリンラボ",
      businessHours: "12:00-21:00 (定休日：月曜日)",
      phoneNumber: "03-5678-1234",
      categories: {
        create: [
          { category: { connect: { id: c1.id } } },
          { category: { connect: { id: c3.id } } },
          { category: { connect: { id: c4.id } } },
        ],
      },
    },
  });

  // const p4 = await prisma.post.create({
  //   data: {
  //     title: "まだ見ぬプリンとの出会い",
  //     content:
  //       "今回はまだ発見していない新しいプリンへの期待を綴ります。<br/>美味しいプリンとの出会いを楽しみにしています。",
  //     coverImageKey: "cover-img-pudding4.jpg",
  //     categories: {
  //       create: [],
  //     },
  //   },
  // });

  console.log("シードデータ作成完了:");
  console.log(`カテゴリ: ${[c1.name, c2.name, c3.name, c4.name].join(", ")}`);
  console.log(`投稿数: 3`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
