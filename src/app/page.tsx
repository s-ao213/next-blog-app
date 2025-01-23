"use client";
import { useState, useEffect, useMemo } from "react";
import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCog,
  faFilter,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesWithNoPosts, setCategoriesWithNoPosts] = useState<
    Category[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // カテゴリ取得
        const categoriesResponse = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
        });
        if (!categoriesResponse.ok) {
          throw new Error("カテゴリの取得に失敗しました");
        }
        const fetchedCategories: Category[] = await categoriesResponse.json();

        // 記事取得
        const postsResponse = await fetch("/api/posts", {
          method: "GET",
          cache: "no-store",
        });
        if (!postsResponse.ok) {
          throw new Error("記事の取得に失敗しました");
        }
        const postResponse: PostApiResponse[] = await postsResponse.json();

        // 記事を処理
        const processedPosts = postResponse.map((rawPost) => ({
          id: rawPost.id,
          title: rawPost.title,
          content: rawPost.content,
          coverImageKey: rawPost.coverImageKey,
          shopName: rawPost.shopName || "",
          businessHours: rawPost.businessHours || "",
          phoneNumber: rawPost.phoneNumber || "",
          createdAt: rawPost.createdAt,
          categories: rawPost.categories.map(
            (categoryWrapper: { category: { id: string; name: string } }) => ({
              id: categoryWrapper.category.id,
              name: categoryWrapper.category.name,
            })
          ),
        }));

        setPosts(processedPosts);

        // カテゴリを設定
        setCategories(fetchedCategories);

        // 記事のないカテゴリを特定
        const categoriesWithPosts = new Set(
          processedPosts.flatMap((post) =>
            post.categories.map((category) => category.id)
          )
        );
        const emptyCategories = fetchedCategories.filter(
          (category) => !categoriesWithPosts.has(category.id)
        );
        setCategoriesWithNoPosts(emptyCategories);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };

    fetchData();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredPosts = useMemo(() => {
    if (!posts) return null;
    if (selectedCategories.length === 0) return posts;

    return posts.filter((post) =>
      selectedCategories.every((selectedCategory) =>
        post.categories.some((category) => category.id === selectedCategory)
      )
    );
  }, [posts, selectedCategories]);

  if (fetchError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        <p className="text-lg">{fetchError}</p>
      </div>
    );
  }

  if (!posts) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        <FontAwesomeIcon
          icon={faSpinner}
          className="mr-2 animate-spin text-2xl"
        />
        <span className="text-lg">読み込み中...</span>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold text-gray-800">投稿記事一覧</h1>
        <Link
          href="/admin"
          className="flex w-full items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 md:w-auto"
        >
          <FontAwesomeIcon icon={faCog} className="mr-2" />
          管理者機能
        </Link>
      </div>

      {/* カテゴリフィルター */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
          <span className="font-medium text-gray-700">カテゴリ絞り込み:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                selectedCategories.includes(category.id)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {category.name}
              {categoriesWithNoPosts.some((c) => c.id === category.id) && (
                <span
                  className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white"
                  title="記事がありません"
                >
                  0
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts?.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faTag}
              className="mb-4 text-4xl text-gray-400"
            />
            <p>該当する記事がありません</p>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="mt-2 text-blue-500 hover:underline"
              >
                フィルターをリセット
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          {filteredPosts?.map((post) => (
            <PostSummary key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Page;
