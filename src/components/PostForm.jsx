import React, { useState, useEffect, useRef } from "react";
import { generatePost, getTrendingTopics } from "../api";

export default function PostForm({ onPostCreated }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch trending topics
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const trending = await getTrendingTopics();
        setSuggestions(trending.data.topics);
      } catch (err) {
        console.error("Error fetching trending topics", err);
      }
    };
    fetchTrending();
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setHoverIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      await generatePost(topic, autoApprove);
      onPostCreated();
      setTopic("");
      setAutoApprove(false);
    } catch (err) {
      console.error("Error generating post", err);
    }
    setLoading(false);
  };

  const handleFocus = () => setShowSuggestions(true);

  const handleSelect = (selected) => {
    setTopic(selected);
    setShowSuggestions(false);
    setHoverIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setHoverIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      setShowSuggestions(true); // 🔹 Keep open
    } else if (e.key === "ArrowUp") {
      setHoverIndex((prev) => Math.max(prev - 1, 0));
      setShowSuggestions(true); // 🔹 Keep open
    } else if (e.key === "Enter" && hoverIndex >= 0) {
      handleSelect(suggestions[hoverIndex].description);
    }
  };

  return (
    <div ref={wrapperRef} className="p-4 border mb-4 relative">
      <h2 className="text-lg font-bold mb-2">Generate New Post</h2>
      <input
        ref={inputRef}
        type="text"
        value={topic}
        onFocus={handleFocus}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter topic..."
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
              className={`p-2 cursor-pointer transition-colors duration-150
                ${hoverIndex === i ? "bg-blue-100" : "bg-white"}
              `}
            >
              <div className="font-bold">{s.topic}</div>
              <div className="text-sm text-gray-600">{s.description}</div>
              <div className="text-xs text-gray-400">{s.tweets} tweets</div>
            </li>
          ))}
        </ul>
      )}

      {/* Auto Approve Toggle */}
      <div className="flex items-center mb-4 mt-2">
        <span className="mr-2">Auto Approve:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={() => setAutoApprove(!autoApprove)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-all duration-200"></div>
          <div
            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
              autoApprove ? "translate-x-5" : ""
            }`}
          ></div>
        </label>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
