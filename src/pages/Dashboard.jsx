import React, { useState, useRef } from "react";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";

export default function Dashboard() {
  const [reload, setReload] = useState(0);
  const generateRef = useRef(null);
  const listRef = useRef(null);

const HEADER_OFFSET = 90;

const scrollTo = (ref) => {
  if (!ref.current) return;

  const y = ref.current.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

  window.scrollTo({ top: y, behavior: "smooth" });
};


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-50">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              in
            </div>
            <span className="text-xl font-semibold text-gray-800">LinkedIn Post Manager</span>
          </div>

          
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-28 pb-10 space-y-20">

        {/* HERO / HOME */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 leading-tight">
              Automate Your LinkedIn Content with AI
            </h1>

            <p className="text-lg text-gray-600">
              Generate high-quality LinkedIn posts automatically using real-time Google trending news and AI — and publish them on a smart schedule.
            </p>

            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">✓</span>
                AI-generated content from trending news
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">✓</span>
                Multi-post scheduling and automation
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">✓</span>
                Keeps your profile active & relevant
              </li>
            </ul>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => scrollTo(generateRef)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-full shadow font-medium transition"
              >
                Start Generating
              </button>
              <button
                onClick={() => scrollTo(listRef)}
                className="border border-indigo-500 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-full font-medium transition"
              >
                View Posts
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <img
              src="https://illustrations.popsy.co/gray/web-design.svg"
              alt="AI Automation"
              className="w-full max-w-md mx-auto drop-shadow-xl"
            />
          </div>

        </section>

        {/* Generate Section */}
        <section ref={generateRef} className="scroll-mt-28">
          <PostForm onPostCreated={() => setReload((r) => r + 1)} />
        </section>

        {/* Post List */}
        <section ref={listRef} className="scroll-mt-28">
          <PostList reload={reload} />
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur border-t border-white/60 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
          <span>© {new Date().getFullYear()} LinkedIn Post Manager</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-500">Privacy</a>
            <a href="#" className="hover:text-indigo-500">Terms</a>
            <a href="#" className="hover:text-indigo-500">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
