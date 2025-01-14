"use client";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

const Page: React.FC = () => {
  return (
    <main>
      <div className="mb-5 text-2xl font-bold">About</div>

      <div
        className={twMerge(
          "mx-auto mb-5 w-full md:w-2/3",
          "flex justify-center"
        )}
      >
        <Image
          src="/images/avatar.png"
          alt="Example Image"
          width={350}
          height={0} // Auto height (アスペクト比を保持)
          priority
          className="rounded-full border-4 border-slate-500 p-1.5"
        />
      </div>

      <div className="space-y-3">
        <div className="md:flex md:justify-center">
          <div className="font-bold md:w-1/6 md:text-center">名 前</div>
          <div className="md:w-5/6">仮名 (Karimei)</div>
        </div>
        <div className="md:flex md:justify-center">
          <div className="font-bold md:w-1/6 md:text-center">連絡先</div>
          <div className="md:w-5/6">ri22077b@st.omu.ac.jp</div>
        </div>
        <div className="md:flex md:justify-center">
          <div className="font-bold md:w-1/6 md:text-center">
            ポートフォリオ
          </div>
          <div className="md:w-5/6">
            <a
              href="https://s-ao213.github.io/portfolio/"
              className="mr-1 text-blue-500 underline"
            >
              Portfolio
            </a>
            (GitHub Pages)
          </div>
        </div>
        <div className="md:flex md:justify-center">
          <div className="font-bold md:w-1/6 md:text-center">自己紹介</div>
          <div className="md:w-5/6">また考える予定</div>
        </div>
      </div>
    </main>
  );
};

export default Page;
