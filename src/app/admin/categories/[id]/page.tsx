"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameError, setNewCategoryNameError] = useState("");
  const [currentCategoryName, setCurrentNameCategory] = useState<
    string | undefined
  >(undefined);
  const [categories, setCategories] = useState<Category[] | null>(null);

  const { id } = useParams() as { id: string };
  const router = useRouter();

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
        throw new Error(
          `カテゴリの取得に失敗しました: (${res.status}: ${res.statusText})`
        );
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
          ? error.message
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleNewCategoryNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setNewCategoryName(value);

    // バリデーション
    if (value.trim() === "") {
      setNewCategoryNameError("カテゴリ名を入力してください");
    } else if (value === currentCategoryName) {
      setNewCategoryNameError("現在のカテゴリ名と同じです");
    } else if (categories?.some((c) => c.name === value && c.id !== id)) {
      setNewCategoryNameError("このカテゴリ名は既に存在します");
    } else {
      setNewCategoryNameError("");
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCategories();
    }
  }, [authLoading, fetchCategories]);

  useEffect(() => {
    const currentCategory = categories?.find((c) => c.id === id);
    if (currentCategory !== undefined) {
      setCurrentNameCategory(currentCategory.name);
    }
  }, [categories, id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      window.alert("認証情報が見つかりません");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        } as HeadersInit,
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      router.push("/admin/categories");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの更新に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      window.alert("認証情報が見つかりません");
      return;
    }

    if (
      !window.confirm(
        `カテゴリ「${currentCategoryName}」を本当に削除しますか？`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Authorization: token,
        } as HeadersInit,
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      router.push("/admin/categories");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの削除に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
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

  if (currentCategoryName === undefined) {
    return (
      <div className="text-red-500">
        指定された id のカテゴリは存在しません。
      </div>
    );
  }

  return (
    <main className="p-4">
      <div className="mb-6 text-2xl font-bold">カテゴリの編集</div>

      <form
        onSubmit={handleSubmit}
        className={twMerge("mb-4 space-y-6", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <div className="block font-bold">現在のカテゴリ名</div>
          <div className="text-gray-500">{currentCategoryName}</div>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="block font-bold">
            新しいカテゴリ名
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full rounded-md border-2 px-3 py-2"
            placeholder="新しいカテゴリの名前を入力してください"
            value={newCategoryName}
            onChange={handleNewCategoryNameChange}
            autoComplete="off"
            required
          />
          {newCategoryNameError && (
            <div className="flex items-center text-sm text-red-500">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" />
              <div>{newCategoryNameError}</div>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className={twMerge(
              "rounded-md bg-indigo-500 px-6 py-2 font-bold text-white",
              "hover:bg-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            disabled={
              isSubmitting ||
              newCategoryNameError !== "" ||
              newCategoryName === ""
            }
          >
            更新
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-red-500 px-6 py-2 font-bold text-white hover:bg-red-600"
          >
            削除
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/categories")}
            className="rounded-md border border-gray-300 px-6 py-2 font-bold hover:bg-gray-100"
          >
            キャンセル
          </button>
        </div>
      </form>

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
    </main>
  );
};

export default Page;
