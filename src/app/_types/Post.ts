import { Category } from "./Category";
// import { CoverImage } from "./CoverImage";

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  categories: Category[];
  coverImageKey: string;
  shopName: string; // 追加
  businessHours: string; // 追加
  phoneNumber: string; // 追加
};
