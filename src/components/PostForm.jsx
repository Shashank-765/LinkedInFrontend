import React, { useState, useEffect, useRef } from "react";
import {
  generatePost,
  getTrendingTopics,
  startAutoPosting,
  stopAutoPosting,
  fetchPosts,
  getSchedulerStatus,
} from "../api";

export default function PostForm() {
  const [topic, setTopic] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [scheduler, setScheduler] = useState({
    running: false,
    lastPostedAt: null,
    nextPostAt: null,
    linkedInPosts: [],
  });
  const [posts, setPosts] = useState([]);

  // Pagination & industry
  const [industry, setIndustry] = useState("top"); // default industry
  const [customIndustry, setCustomIndustry] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const wrapperRef = useRef(null);
console.log('industry', industry)
  // Fetch default topics on first load
  useEffect(() => {
    fetchTrendingTopics(1, true);
    fetchAllPosts();
    fetchSchedulerStatus();

    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, [industry]);

  // Fetch trending topics
  const fetchTrendingTopics = async (pageNumber = 1, reset = false) => {
    try {
      setLoadingMore(true);
      const selectedIndustry = industry === "custom" ? customIndustry.trim() : industry;
      if (!selectedIndustry) return;

      const res = await getTrendingTopics(selectedIndustry, pageNumber, 5);
      const newTopics = res.data.topics || [];

      if (reset) setSuggestions(newTopics);
      else setSuggestions((prev) => [...prev, ...newTopics]);

      setHasMore(newTopics.length === 5);
      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching trending topics", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchAllPosts = async () => {
    try {
      const res = await fetchPosts();
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const res = await getSchedulerStatus();
      setScheduler(res.data || res);
    } catch (err) {
      console.error("Error fetching scheduler status", err);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      await generatePost(topic, image, autoApprove);
      await fetchAllPosts();
      setTopic("");
      setImage("");
      setAutoApprove(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleToggleScheduler = async () => {
    try {
      if (!scheduler.running) await startAutoPosting();
      else await stopAutoPosting();
      await fetchSchedulerStatus();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle scheduler");
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setHoverIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Infinite scroll for trending topics
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
        !loadingMore &&
        hasMore
      ) {
        fetchTrendingTopics(page + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loadingMore, industry, customIndustry]);

  // Suggestions logic
  const handleFocus = () => setShowSuggestions(true);
  const handleSelect = (selected) => {
    console.log('selected', selected)
    setTopic(selected);
    setShowSuggestions(false);
    setHoverIndex(-1);
  };
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") setHoverIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    else if (e.key === "ArrowUp") setHoverIndex((prev) => Math.max(prev - 1, 0));
    else if (e.key === "Enter" && hoverIndex >= 0) handleSelect(suggestions[hoverIndex].topic);
  };

  return (
    <div ref={wrapperRef} className="p-4 border mb-4 relative">

      {/* Industry Selector */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Catogories</label>
        <div className="flex gap-2">
          <select
            value={industry}
            onChange={(e) => {
              const val = e.target.value;
              setIndustry(val);
              setPage(1);
              setHasMore(true);
              if (val !== "custom") fetchTrendingTopics(1, true);
            }}
            className="border p-2 flex-1"
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
            <option value="custom">custom</option>
          </select>

          {industry === "custom" && (
            <input
              type="text"
              placeholder="Enter custom industry"
              className="border p-2 flex-1"
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              onBlur={() => {
                if (customIndustry.trim()) fetchTrendingTopics(1, true);
              }}
            />
          )}
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">Generate New Post</h2>

      {/* Topic Input */}
      <input
        type="text"
        value={topic}
        onFocus={handleFocus}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search Trending Topics"
        className="border p-2 w-full mb-2"
      />

      {/* Suggestions Dropdown */}
      {(showSuggestions || hoverIndex >= 0) && suggestions.length > 0 && (
        <div className="absolute z-10 bg-white border rounded shadow-md w-full max-h-60 overflow-y-auto">
                    <ul>
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onClick={() => {
                    handleSelect(s.topic);
                    setImage(s.image);
                  }}
                  onMouseEnter={() => setHoverIndex(i)}
                  className={`p-2 cursor-pointer flex gap-3 items-center ${
                    hoverIndex === i ? "bg-blue-100" : "bg-white"
                  }`}
                >
                  {/* Thumbnail */}
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.topic}
                      className="w-12 h-12 object-cover rounded"
                      loading="lazy"
                      onError={e => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Text content */}
                  <div className="flex flex-col">
                    <div className="font-bold">{s.topic}</div>
                    <div className="text-xs text-gray-400">{s.source}</div>
                    <div className="text-xs text-gray-400">{s.tweets} Rank</div>
                  </div>
                </li>
              ))}
            </ul>


          {loadingMore && (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          )}

          {!loadingMore && hasMore && (
            <button
              onClick={() => fetchTrendingTopics(page + 1)}
              className="w-full text-blue-600 p-2 border-t hover:bg-blue-50"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {/* Auto Approve */}
      <div className="flex items-center mb-4 mt-2">
        <span className="mr-2">Auto Approve:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={() => setAutoApprove(!autoApprove)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
          <div
            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all ${
              autoApprove ? "translate-x-5" : ""
            }`}
          ></div>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        <button
          onClick={handleToggleScheduler}
          className={`px-4 py-2 rounded text-white ${
            scheduler.running ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {scheduler.running ? "Stop Auto-Posting" : "Start Auto-Posting"}
        </button>
      </div>

      {/* Scheduler Info */}
      <div className="mb-4 text-sm text-gray-700 border p-2 rounded">
        <p>
          <strong>Status:</strong> {scheduler.running ? "Active ✅" : "Stopped ❌"}
        </p>
        <p>
          <strong>Last Posted At:</strong>{" "}
          {scheduler.lastPostedAt
            ? new Date(scheduler.lastPostedAt).toLocaleString()
            : "-"}
        </p>
        <p>
          <strong>Next Post At:</strong>{" "}
          {scheduler.nextPostAt
            ? new Date(scheduler.nextPostAt).toLocaleString()
            : "-"}
        </p>

        {scheduler.linkedInPosts?.length > 0 && (
          <div className="mt-2">
            <strong>LinkedIn Posts:</strong>
            <ul className="list-disc list-inside max-h-32 overflow-y-auto">
              {scheduler.linkedInPosts.map((post, idx) => (
                <li key={idx}>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    {post.url}
                  </a>{" "}
                  ({post.postedAt ? new Date(post.postedAt).toLocaleString() : "-"})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Posts List */}
      <div className="mt-4">
        <h3 className="font-bold mb-2">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {posts.map((post) => (
              <li key={post._id} className="border p-2 rounded">
                <div>
                  <strong>Topic:</strong> {post.topic}
                </div>
                <div>
                  <strong>Status:</strong> {post.status}
                </div>
                <div>
                  <strong>Scheduled At:</strong>{" "}
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "-"}
                </div>
                <div>
                  <strong>Posted At:</strong>{" "}
                  {post.postedAt ? new Date(post.postedAt).toLocaleString() : "-"}
                </div>
                {post.linkedinPostUrl && (
                  <a
                    href={post.linkedinPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View on LinkedIn
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
