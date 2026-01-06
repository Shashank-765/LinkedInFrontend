import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  generatePost,
  getTrendingTopics,
  startAutoPosting,
  stopAutoPosting,
  fetchPosts,
  getSchedulerStatus,
  updateAutoPostSchedule, // 🔹 added
} from "../api";

export default function PostForm({ onPostCreated }) {
  const [topic, setTopic] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);

  const [industry, setIndustry] = useState("top");
  const [customIndustry, setCustomIndustry] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageFile, setImageFile] = useState(null);


  const [scheduler, setScheduler] = useState({
    running: false,
    lastPostedAt: null,
    nextPostAt: null,
    intervalMinutes: null, // 🔹 added
  });

  const [intervalInput, setIntervalInput] = useState(""); // 🔹 added

  const [posts, setPosts] = useState([]);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});
  useEffect(() => {
    fetchAllPosts();
    fetchSchedulerStatus();
  }, []);

  useEffect(() => {
    setSuggestions([]);
    setPage(1);
    setHasMore(true);
    if (industry !== "custom") fetchTrendingTopics(1, true);
  }, [industry]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
        setHoverIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTrendingTopics = async (pageNumber = 1, reset = false) => {
    try {
      if (loadingMore) return;
      setLoadingMore(true);

      const selectedIndustry =
        industry === "custom" ? customIndustry.trim() : industry;
      if (!selectedIndustry) return;

      const res = await getTrendingTopics(selectedIndustry, 1, pageNumber * 5);
      const newTopics = res.data.topics || [];

      setSuggestions((prev) => (reset ? newTopics : [...prev, ...newTopics]));
      setHasMore(newTopics.length === 5);
      setPage(pageNumber);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchAllPosts = async () => {
    const res = await fetchPosts();
    setPosts(res.data || []);
  };

  const fetchSchedulerStatus = async () => {
    const res = await getSchedulerStatus();
    const data = res?.data.data ;
    setScheduler(data);
    console.log('scheduler', data)
    setIntervalInput(data.intervalMinutes || "");
  };

  const handleGenerate = async () => {
  if (!topic) return;
  setLoading(true);

  if (imageFile) {
    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("autoApprove", autoApprove);
    formData.append("image", imageFile);

    // if user also typed image URL, ignore it because file has priority
    await API.post("/posts/generate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    await generatePost(topic, image, autoApprove);
  }

  await fetchAllPosts();
  setTopic("");
  setImage("");
  setImageFile(null);
  setAutoApprove(false);
  onPostCreated?.();
  setLoading(false);
};


  const handleToggleScheduler = async () => {
    if (!scheduler.running) await startAutoPosting();
    else await stopAutoPosting();
    fetchSchedulerStatus();
  };

  const handleUpdateInterval = async () => {
    if (!intervalInput) return;
    await updateAutoPostSchedule(Number(intervalInput));
    fetchSchedulerStatus();
  };

  const handleSelect = (val, img) => {
    setTopic(val);
    setImage(img || "");
    setShowSuggestions(false);
    setHoverIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") setHoverIndex((i) => Math.min(i + 1, suggestions.length - 1));
    if (e.key === "ArrowUp") setHoverIndex((i) => Math.max(i - 1, 0));
    if (e.key === "Escape") setShowSuggestions(false);
    if (e.key === "Enter" && hoverIndex >= 0)
      handleSelect(suggestions[hoverIndex].topic, suggestions[hoverIndex].image);
  };


   return (
  <div className=" bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-50 p-8">
    <div className="max-w-7xl mx-auto space-y-8">

     

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left Panel */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl space-y-6 relative">

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500">Category</label>
            <div className="flex gap-3">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="top">India</option>
            <option value="world">World</option>
            <option value="local">Local</option>
            <option value="business">Business</option>
            <option value="technology">Technology</option>
            <option value="entertainment">Entertainment</option>
            <option value="sports">Sports</option>
            <option value="science">Science</option>
            <option value="health">Health</option>
            <option value="custom">Custom</option>
              </select>

              {industry === "custom" && (
                <input
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="Custom category"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  onBlur={() => customIndustry && fetchTrendingTopics(1, true)}
                />
              )}
            </div>
          </div>

          {/* Topic */}
          <div className="relative">
            <input
              ref={inputRef}
              value={topic}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search trending topics..."
              className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-base focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm"
            />
            <input
  type="file"
  accept="image/*"
  onChange={(e) => setImageFile(e.target.files[0])}
  className="block text-sm mt-2"
/>


            {/* Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute mt-3 w-full bg-white rounded-2xl border border-gray-100 shadow-2xl max-h-72 overflow-y-auto z-50 animate-fade-in"
              >
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelect(s.topic, s.image)}
                    onMouseEnter={() => setHoverIndex(i)}
                    className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition ${
                      hoverIndex === i ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    {s.image ? (
                      <img src={s.image} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    )}
                    <div>
                      <div className="font-medium text-sm text-gray-800">{s.topic}</div>
                      <div className="text-xs text-gray-400">{s.source}</div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={() => fetchTrendingTopics(page + 1)}
                    className="w-full py-3 text-sm text-indigo-600 hover:bg-indigo-50 border-t"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-3 text-sm text-gray-600">
              <input type="checkbox" checked={autoApprove} onChange={() => setAutoApprove(!autoApprove)} />
              Auto approve generated posts
            </label>

            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg hover:scale-[1.02] active:scale-[0.98] transition"
              >
                {loading ? "Generating..." : "Generate"}
              </button>

              <button
                onClick={handleToggleScheduler}
                className={`px-7 py-3 rounded-full font-medium shadow-lg transition ${
                  scheduler.running
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {scheduler.running ? "Stop Auto" : "Start Auto"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl">
              <h3 className="font-semibold text-gray-800 mb-3">⏱ Scheduler</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Status: <strong>{scheduler.running ? "Active" : "Stopped"}</strong></p>
                <p>Last: {scheduler.lastPostedAt ? new Date(scheduler.lastPostedAt).toLocaleString() : "-"}</p>
                <p>Next: {scheduler.nextPostAt ? new Date(scheduler.nextPostAt).toLocaleString() : "-"}</p>
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  type="number"
                  placeholder="Interval (minutes)"
                  value={intervalInput}
                  onChange={(e) => setIntervalInput(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
                <button
                  onClick={handleUpdateInterval}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm"
                >
                  Update
                </button>
              </div>
            </div>


          <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">📝 History</h3>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {posts.length === 0 ? (
                <p className="text-sm text-gray-400">No posts yet</p>
              ) : (
                posts.map((p) => (
                  <div key={p._id} className="border border-gray-100 rounded-xl p-4 hover:bg-slate-50 transition">
                    <div className="font-medium text-sm truncate">{p.topic}</div>
                    <div className="text-xs text-gray-500">{p.status}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);

}
