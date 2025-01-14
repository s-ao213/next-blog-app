"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { Post } from "@/app/_types/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";

const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { id } = useParams() as { id: string };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2)); // 取得したデータを確認
        setPost(data as Post);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };
    fetchPosts();
  }, [id]);

  if (fetchError) {
    return <div>{fetchError}</div>;
  }

  if (!post) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });

  return (
    <main>
      <div className="space-y-2">
        <div className="mb-2 text-2xl font-bold">{post.title}</div>
        {post.coverImage && (
          <div>
            <Image
              src={post.coverImage.url}
              alt={post.title}
              width={post.coverImage.width}
              height={post.coverImage.height}
              priority
              className="rounded-xl"
            />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
      </div>
    </main>
  );
};

export default Page;
