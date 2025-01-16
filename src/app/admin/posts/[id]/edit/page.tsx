"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faSave,
  faImage,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import CryptoJS from "crypto-js";

type Category = {
  id: string;
  name: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  categories: Category[];
};

const calculateMD5Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>();
  const { token, session, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("認証情報が見つかりません");
        setIsLoading(false);
        return;
      }

      try {
        // カテゴリ一覧の取得
        const categoriesResponse = await fetch("/api/admin/categories", {
          headers: {
            Authorization: token,
          } as HeadersInit,
        });

        if (!categoriesResponse.ok) {
          throw new Error("カテゴリの取得に失敗しました");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // 投稿データの取得
        const postResponse = await fetch(`/api/admin/posts/${postId}`, {
          headers: {
            Authorization: token,
          } as HeadersInit,
        });
        if (!postResponse.ok) {
          throw new Error("投稿データの取得に失敗しました");
        }
        const postData = await postResponse.json();
        setPost(postData);
        setSelectedCategories(
          postData.categories.map((cat: Category) => cat.id)
        );
        setCoverImageUrl(postData.coverImageURL);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
        console.error("Error fetching data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [postId, token, authLoading]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const bucketName = "cover_image";
    setCoverImageKey(undefined);
    setCoverImageUrl(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert("ファイルサイズは5MB以下にしてください");
      return;
    }

    try {
      const fileHash = await calculateMD5Hash(file);
      const path = `private/${fileHash}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, { upsert: true });

      if (error || !data) {
        throw new Error(`アップロードに失敗 ${error.message}`);
      }

      setCoverImageKey(data.path);
      const publicUrlResult = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      setCoverImageUrl(publicUrlResult.data.publicUrl);
    } catch (e) {
      alert("画像のアップロードに失敗しました");
      console.error("Error uploading image:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!post || !coverImageUrl || !token) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          title: formData.get("title"),
          content: formData.get("content"),
          coverImageURL: coverImageUrl,
          categoryIds: selectedCategories,
        }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      router.push("/admin/posts");
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "予期せぬエラーが発生しました";
      alert(`保存に失敗しました: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!post) {
    return <div className="text-gray-500">投稿が見つかりません</div>;
  }

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/admin/posts"
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            戻る
          </Link>
          <h1 className="text-2xl font-bold">投稿の編集</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={post.title}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            カバー画像
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="relative size-32 overflow-hidden rounded-lg">
              {coverImageUrl && (
                <Image
                  className="w-1/2 border-2 border-gray-300"
                  src={coverImageUrl}
                  alt="プレビュー画像"
                  width={1024}
                  height={1024}
                  priority
                />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden={true}
              ref={hiddenFileInputRef}
            />
            <button
              type="button"
              onClick={() => hiddenFileInputRef.current?.click()}
              className="flex cursor-pointer items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FontAwesomeIcon icon={faImage} className="mr-2" />
              画像を選択
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            カテゴリ
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center space-x-2"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([
                        ...selectedCategories,
                        category.id,
                      ]);
                    } else {
                      setSelectedCategories(
                        selectedCategories.filter((id) => id !== category.id)
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
          >
            内容
          </label>
          <textarea
            id="content"
            name="content"
            defaultValue={post.content}
            required
            rows={10}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="mr-2 animate-spin"
                />
                保存中...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                保存
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
