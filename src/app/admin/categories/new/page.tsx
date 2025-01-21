// src/app/admin/categories/new/page.tsx
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";

const Page: React.FC = () => {
  const { session } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [nameError, setNameError] = useState("");

  const validateCategoryName = (name: string): string => {
    if (name.length < 2 || name.length > 16) {
      return "2文字以上16文字以内で入力してください。";
    }
    return "";
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCategoryName(newName);
    setNameError(validateCategoryName(newName));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      window.alert("認証情報が見つかりません");
      return;
    }

    const {
      data: { session: currentSession },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !currentSession) {
      window.alert("認証セッションの取得に失敗しました");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ここにAuthorizationヘッダーを追加
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify({ name: categoryName }),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの作成に失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-4">
      <h1 className="mb-6 text-2xl font-bold">カテゴリの新規作成</h1>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block font-bold">
            カテゴリ名
          </label>
          <input
            type="text"
            id="name"
            value={categoryName}
            onChange={handleNameChange}
            className="w-full rounded-md border-2 px-3 py-2"
            placeholder="新しいカテゴリの名前を入力"
            required
          />
          {nameError && (
            <div className="flex items-center text-sm text-red-500">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" />
              {nameError}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || !!nameError || !categoryName}
            className={twMerge(
              "rounded-md bg-indigo-500 px-6 py-2 font-bold text-white",
              "hover:bg-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-6 py-2 font-bold hover:bg-gray-100"
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
