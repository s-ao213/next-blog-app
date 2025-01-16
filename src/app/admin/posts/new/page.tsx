"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";

type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageURL, setNewCoverImageURL] = useState("");
  const [newCoverImageKey, setNewCoverImageKey] = useState("hoge");

  const router = useRouter();
  const { token, session, isLoading: authLoading } = useAuth();

  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // 認証状態チェック
  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login"); // ログインページへリダイレクト
    }
  }, [session, authLoading, router]);

  // カテゴリ取得
  useEffect(() => {
    const fetchCategories = async () => {
      if (!session) return; // 未認証の場合は実行しない

      try {
        setIsLoading(true);
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }

        const apiResBody = (await res.json()) as CategoryApiResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
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
    };

    fetchCategories();
  }, [session]);

  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(e.target.value);
  };

  const updateNewCoverImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCoverImageURL(e.target.value);
  };

  const updateNewCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !session) {
      window.alert("認証が必要です。ログインしてください。");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageURL: newCoverImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = "/api/admin/posts";
      const res = await fetch(requestUrl, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("認証が失効しました。再度ログインしてください。");
        }
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const postResponse = await res.json();
      setIsSubmitting(false);
      router.push(`/posts/${postResponse.id}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);

      // 認証エラーの場合はログインページへリダイレクト
      if (error instanceof Error && error.message.includes("認証")) {
        router.push("/login");
      }
    }
  };

  // 認証チェック中の表示
  if (authLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        認証を確認中...
      </div>
    );
  }

  // 認証済みでない場合の表示（通常はuseEffectでリダイレクトされるため表示されない）
  if (!session) {
    return (
      <div className="text-red-500">
        このページにアクセスするには認証が必要です。
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!checkableCategories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の新規作成</div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        {/* <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newCoverImageURL}
            onChange={updateNewCoverImageURL}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
        </div> */}
        {/* 
        <div className="space-y-1">
          <label htmlFor="coverImageKey" className="block font-bold">
            カバーイメージ (Key)
          </label>
          <input
            type="url"
            id="coverImageKey"
            name="coverImageKey"
            className="w-full rounded-md border-2 px-2 py-1 text-gray-500"
            value={newCoverImageKey}
            disabled
            readOnly
            required
          />
        </div> */}

        <input
          type="file"
          id="coverImage"
          onChange={updateNewCoverImage}
          accept="image/*"
        />

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories.length > 0 ? (
              checkableCategories.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed"
            )}
            disabled={isSubmitting}
          >
            記事を投稿
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
