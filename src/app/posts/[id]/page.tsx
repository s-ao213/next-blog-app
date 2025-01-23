"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { Post } from "@/app/_types/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams() as { id: string };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/posts/${id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPost(data);

        // 画像URLの取得をシンプルに
        if (data.coverImageKey) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("cover_image")
            .getPublicUrl(data.coverImageKey);

          setImageUrl(publicUrl);
          setImageError(null);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setFetchError(
          error instanceof Error
            ? error.message
            : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        <span>読み込み中...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-500">
        <p className="font-bold">エラーが発生しました</p>
        <p>{fetchError}</p>
      </div>
    );
  }

  if (!post) {
    return <div className="p-4 text-gray-500">記事が見つかりません</div>;
  }

  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p"],
    ALLOWED_ATTR: ["class"],
  });

  return (
    <main className="mx-auto max-w-4xl p-4">
      <article className="space-y-6">
        <h1 className="text-3xl font-bold">{post.title}</h1>

        {/* 店舗情報セクション */}
        <div className="rounded-lg bg-gray-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">店舗情報</h2>
          {post.shopName && (
            <div className="mb-2 flex items-center">
              <strong className="mr-2">店名:</strong>
              <span>{post.shopName}</span>
            </div>
          )}
          {post.businessHours && (
            <div className="mb-2 flex items-center">
              <strong className="mr-2">営業時間:</strong>
              <span>{post.businessHours}</span>
            </div>
          )}
          {post.phoneNumber && (
            <div className="flex items-center">
              <strong className="mr-2">電話番号:</strong>
              <span>{post.phoneNumber}</span>
            </div>
          )}
        </div>

        {imageError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-500">
            {imageError}
          </div>
        )}

        {imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
              onError={() => setImageError("画像の読み込みに失敗しました")}
            />
          </div>
        )}

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </article>
    </main>
  );
};

export default Page;
