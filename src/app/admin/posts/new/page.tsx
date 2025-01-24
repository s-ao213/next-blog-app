"use client";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";
import CryptoJS from "crypto-js";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import Link from "next/link";

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

const calculateMD5Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
};

const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const bucketName = "cover_image";
  const [coverImageKey, setCoverImageKey] = useState<string | undefined>();
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<
    string | undefined
  >();
  const router = useRouter();
  const { token, session, isLoading: authLoading } = useAuth();

  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // page.tsx内のuseState
  const [shopName, setShopName] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login");
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!session) return;

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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files?.[0];
    const fileHash = await calculateMD5Hash(file);
    const path = `${fileHash}`; // ここを変更
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });

    if (error || !data) {
      window.alert(`アップロードに失敗 ${error.message}`);
      return;
    }

    setCoverImageKey(data.path);
    // プレビュー表示用にURLを取得
    const publicUrlResult = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    setCoverImagePreviewUrl(publicUrlResult.data.publicUrl); // ここを変更
  };

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
        coverImageKey: coverImageKey, // ここを変更
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
      router.push("/admin/posts"); // この行を変更
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);

      if (error instanceof Error && error.message.includes("認証")) {
        router.push("/login");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        認証を確認中...
      </div>
    );
  }

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
          <label htmlFor="shopName" className="block font-bold">
            店舗名
          </label>
          <input
            type="text"
            id="shopName"
            name="shopName"
            className="w-full rounded-md border-2 px-2 py-1"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="店舗名を入力してください"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="businessHours" className="block font-bold">
            営業時間
          </label>
          <input
            type="text"
            id="businessHours"
            name="businessHours"
            className="w-full rounded-md border-2 px-2 py-1"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="営業時間を入力してください（例：10:00-20:00）"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="phoneNumber" className="block font-bold">
            電話番号
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            className="w-full rounded-md border-2 px-2 py-1"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="電話番号を入力してください"
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
        <div className="space-y-1">
          <label htmlFor="coverImage" className="block font-bold">
            カバーイメージ
          </label>
          <input
            type="file"
            id="coverImage"
            accept="image/*"
            onChange={handleImageChange}
            hidden
            ref={hiddenFileInputRef}
          />
          <button
            onClick={() => hiddenFileInputRef.current?.click()}
            type="button"
            className="rounded-md bg-indigo-500 px-3 py-1 text-white"
          >
            ファイルを選択
          </button>

          {coverImagePreviewUrl && (
            <div className="mt-2">
              <Image
                className="w-full border-2 border-gray-300" // "w-1/2" を "w-full" に変更
                src={coverImagePreviewUrl}
                alt="プレビュー画像"
                width={1024}
                height={1024}
                priority
              />
            </div>
          )}
        </div>
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
