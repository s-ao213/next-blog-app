"use client";
import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faPlus,
  faPencil,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";

type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const Page: React.FC = () => {
  const { token, session, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!token) {
      setFetchErrorMsg("認証情報が見つかりません");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: token,
        } as HeadersInit,
      });

      if (!res.ok) {
        setCategories(null);
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const apiResBody = (await res.json()) as CategoryApiResponse[];
      setCategories(
        apiResBody.map((body) => ({
          id: body.id,
          name: body.name,
        }))
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      fetchCategories();
    }
  }, [authLoading, fetchCategories]);

  const handleDelete = async (categoryId: string) => {
    if (!token) {
      window.alert("認証情報が見つかりません");
      return;
    }

    if (!window.confirm("このカテゴリを削除してもよろしいですか？")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Authorization: token,
        } as HeadersInit,
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      await fetchCategories();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの削除に失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!categories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  return (
    <main className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">カテゴリ管理</h1>
        <Link
          href="/admin/categories/new"
          className="flex items-center rounded-md bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          新規作成
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-gray-500">
          （カテゴリは1個も作成されていません）
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="mb-4 text-lg font-semibold">{category.name}</div>
              <div className="flex justify-end space-x-2">
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="flex items-center rounded-md bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                >
                  <FontAwesomeIcon icon={faPencil} className="mr-1" />
                  編集
                </Link>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex items-center rounded-md bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-1" />
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Page;
