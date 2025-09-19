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

  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchTrendingTopics();
    fetchAllPosts();
    fetchSchedulerStatus();

    const interval = setInterval(fetchSchedulerStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchTrendingTopics = async () => {
    try {
      const res = await getTrendingTopics();
      setSuggestions(res.data.topics || []);
    } catch (err) {
      console.error("Error fetching trending topics", err);
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
      await generatePost(topic, autoApprove);
      await fetchAllPosts();
      setTopic("");
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
 // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setHoverIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  
  // Suggestions logic
  const handleFocus = () => setShowSuggestions(true);
  const handleSelect = (selected) => {
    setTopic(selected);
    setShowSuggestions(false);
    setHoverIndex(-1);
  };
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") setHoverIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    else if (e.key === "ArrowUp") setHoverIndex((prev) => Math.max(prev - 1, 0));
    else if (e.key === "Enter" && hoverIndex >= 0) handleSelect(suggestions[hoverIndex].description);
  };

  return (
    <div ref={wrapperRef} className="p-4 border mb-4 relative">
      <h2 className="text-lg font-bold mb-2">Generate New Post</h2>

      {/* Topic Input */}
      <input
        type="text"
        value={topic}
        onFocus={handleFocus}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="search Topics"
        className="border p-2 w-full mb-2"
      />

      {/* Suggestions Dropdown */}
      {(showSuggestions || hoverIndex >= 0) && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded shadow-md w-full max-h-40 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s.description)}
              onMouseEnter={() => setHoverIndex(i)}
              className={`p-2 cursor-pointer ${hoverIndex === i ? "bg-blue-100" : "bg-white"}`}
            >
              <div className="font-bold">{s.topic}</div>
              <div className="text-sm text-gray-600">{s.description}</div>
              <div className="text-xs text-gray-400">{s.tweets} tweets</div>
            </li>
          ))}
        </ul>
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
          <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all ${autoApprove ? "translate-x-5" : ""}`}></div>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={handleGenerate} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? "Generating..." : "Generate"}
        </button>
        <button onClick={handleToggleScheduler} className={`px-4 py-2 rounded text-white ${scheduler.running ? "bg-red-500" : "bg-green-500"}`}>
          {scheduler.running ? "Stop Auto-Posting" : "Start Auto-Posting"}
        </button>
      </div>

    {/* Scheduler Info */}
<div className="mb-4 text-sm text-gray-700 border p-2 rounded">
  <p><strong>Status:</strong> {scheduler.running ? "Active ✅" : "Stopped ❌"}</p>
  <p><strong>Last Posted At:</strong> {scheduler.lastPostedAt ? new Date(scheduler.lastPostedAt).toLocaleString() : "-"}</p>
  <p><strong>Next Post At:</strong> {scheduler.nextPostAt ? new Date(scheduler.nextPostAt).toLocaleString() : "-"}</p>

  {/* Safe check using optional chaining and default empty array */}
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
        {posts.length === 0 ? <p className="text-gray-500">No posts yet.</p> :
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {posts.map((post) => (
              <li key={post._id} className="border p-2 rounded">
                <div><strong>Topic:</strong> {post.topic}</div>
                <div><strong>Status:</strong> {post.status}</div>
                <div><strong>Scheduled At:</strong> {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "-"}</div>
                <div><strong>Posted At:</strong> {post.postedAt ? new Date(post.postedAt).toLocaleString() : "-"}</div>
                {post.linkedinPostUrl && <a href={post.linkedinPostUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View on LinkedIn</a>}
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}
