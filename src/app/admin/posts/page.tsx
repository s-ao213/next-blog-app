"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faEdit,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  content: string;
  coverImage: {
    url: string;
    width: number;
    height: number;
  };
  categories: {
    id: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

const AdminPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期せぬエラーが発生しました");
      console.error("Error fetching posts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!window.confirm("この投稿を削除してもよろしいですか？")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      // 成功したら投稿一覧を再取得
      await fetchPosts();
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "予期せぬエラーが発生しました";
      window.alert(`削除に失敗しました: ${errorMsg}`);
      console.error("Error deleting post:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">投稿記事の管理</h1>
        <Link
          href="/admin/posts/new"
          className="flex items-center rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          新規作成
        </Link>
      </div>

      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="text-gray-500">削除中...</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                タイトル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                作成日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                更新日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {posts?.map((post) => (
              <tr key={post.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {post.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {post.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="rounded-md bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded-md bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                      disabled={isDeleting}
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-1" />
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default AdminPostsPage;
