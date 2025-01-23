export type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageKey: string;
  shopName?: string;
  businessHours?: string;
  phoneNumber?: string;
  createdAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};
