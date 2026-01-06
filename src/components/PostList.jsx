import React, { useState, useEffect } from "react";
import {
  fetchPosts,
  approvePost,
  schedulePost,
  bulkSchedulePosts,
} from "../api";

export default function PostList({reload}) {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTime, setBulkTime] = useState("");
  const [perDay, setPerDay] = useState(1);
  const [manualDate, setManualDate] = useState("");
  const [viewPost, setViewPost] = useState(null);
  const [schedulePostId, setSchedulePostId] = useState(null);
  const [singleScheduleTime, setSingleScheduleTime] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await fetchPosts();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [reload]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const toggleSelectPost = (id) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleApprove = async (id) => {
    await approvePost(id);
    loadPosts();
  };

  const openScheduleModal = (id) => {
    setSchedulePostId(id);
    setSingleScheduleTime("");
  };

  const confirmSingleSchedule = async () => {
    if (!singleScheduleTime) return alert("Please select a time");
    await schedulePost(schedulePostId, singleScheduleTime);
    setSchedulePostId(null);
    setSingleScheduleTime("");
    loadPosts();
  };

  const confirmBulkSchedule = async () => {
    if (!bulkTime || selectedPosts.length === 0)
      return alert("Please select posts and time");

    await bulkSchedulePosts({
      ids: selectedPosts,
      startTime: bulkTime,
      perDay,
      manualDate: manualDate || null,
    });

    setSelectedPosts([]);
    setBulkModalOpen(false);
    setManualDate("");
    loadPosts();
  };

  const filtered = posts.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedPosts = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getPageNumbers = () => {
    const pages = new Set();
    for (let i = 1; i <= Math.min(3, totalPages); i++) pages.add(i);
    for (let i = currentPage - 1; i <= currentPage + 1; i++)
      if (i > 0 && i <= totalPages) pages.add(i);
    for (let i = Math.max(totalPages - 2, 1); i <= totalPages; i++) pages.add(i);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
      result.push(sorted[i]);
    }

    return result;
  };

  const resolveImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  // console.log('process.env.REACT_APP_API_BASE_URL', `https://6bskx5w6-3002.inc1.devtunnels.ms${img}`)
  return `https://aipostbe.bastionex.net${img}`;
};

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Posts</h2>

      {/* Filters + Bulk */}
<div className="flex items-center justify-between mb-3">

  {/* Bulk button on left */}
  <button
    onClick={() => setBulkModalOpen(true)}
    disabled={selectedPosts.length === 0}
    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white
               bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md
               hover:shadow-lg hover:scale-[1.02] transition-all
               disabled:opacity-40 disabled:cursor-not-allowed"
  >
    📅 Bulk Schedule
    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
      {selectedPosts.length}
    </span>
  </button>

  {/* Filters on right */}
  <div className="flex gap-2">
    {["all", "pending", "approved", "scheduled", "posted", "failed"].map(
      (f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              filter === f
                ? "bg-blue-500 text-white shadow-md scale-105"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      )
    )}
  </div>

</div>



      <div className="overflow-x-auto rounded-xl shadow-sm border bg-white">
  <table className="w-full table-fixed">
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-16">
          Select
        </th>
        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-[45%]">
          Topic
        </th>
        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          Status
        </th>
        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          Scheduled
        </th>
        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          Posted
        </th>
        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-40">
          Actions
        </th>
      </tr>
    </thead>

    <tbody className="divide-y">
      {paginatedPosts.map((post) => (
        <tr
          key={post._id}
          className="hover:bg-gray-50 transition-colors align-top"
        >
          <td className="p-3 text-center">
            {post.status === "approved" && (
              <input
                type="checkbox"
                checked={selectedPosts.includes(post._id)}
                onChange={() => toggleSelectPost(post._id)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            )}
          </td>

          {/* Topic */}
          <td
            title={post.topic}
            className="p-3 text-sm text-gray-800 max-w-[420px] line-clamp-2 break-words"
          >
            {post.topic}
          </td>

          {/* Status */}
          <td className="p-3 text-sm">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                post.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : post.status === "approved"
                  ? "bg-blue-100 text-blue-700"
                  : post.status === "scheduled"
                  ? "bg-purple-100 text-purple-700"
                  : post.status === "posted"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {post.status}
            </span>
          </td>

          {/* Scheduled */}
          <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
            {post.scheduledAt
              ? new Date(post.scheduledAt).toLocaleString()
              : "-"}
          </td>

          {/* Posted */}
          <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
            {post.postedAt
              ? new Date(post.postedAt).toLocaleString()
              : "-"}
          </td>

          {/* Actions */}
          <td className="p-3">
            <div className="flex gap-2 whitespace-nowrap">
              {post.status === "pending" && (
                <button
                  className="px-3 py-1 text-xs font-medium rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                  onClick={() => handleApprove(post._id)}
                >
                  Approve
                </button>
              )}

              {post.status === "approved" && (
                <button
                  className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500 text-white hover:bg-purple-600 transition"
                  onClick={() => openScheduleModal(post._id)}
                >
                  Schedule
                </button>
              )}

              <button
                className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                onClick={() => setViewPost(post)}
              >
                View
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>



     {/* Pagination */}
{totalPages > 1 && (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-6">

    {/* Page info */}
    <span className="text-sm text-gray-500">
      Page <span className="font-medium text-gray-800">{currentPage}</span> of{" "}
      <span className="font-medium text-gray-800">{totalPages}</span>
    </span>

    {/* Controls */}
    <div className="flex items-center gap-1 flex-wrap">

      {/* Prev */}
      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-full text-sm font-medium
                   bg-white border shadow-sm hover:bg-gray-50
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span
            key={i}
            className="px-3 py-1.5 text-gray-400 select-none"
          >
            …
          </span>
        ) : (
          <button
            key={i}
            onClick={() => setCurrentPage(p)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition
              ${
                currentPage === p
                  ? "bg-blue-500 text-white shadow-md scale-105"
                  : "bg-white border shadow-sm hover:bg-gray-50"
              }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() =>
          setCurrentPage((p) => Math.min(p + 1, totalPages))
        }
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-full text-sm font-medium
                   bg-white border shadow-sm hover:bg-gray-50
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Next →
      </button>
    </div>
  </div>
)}





{/* View Modal */}
{viewPost && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
<div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg relative overflow-y-auto max-h-[90vh] post-scroll">


      {/* Close Button */}
      <button
        className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow"
        onClick={() => setViewPost(null)}
      >
        ✖
      </button>

      {/* Images at Top */}
      {viewPost.images && viewPost.images.length > 0 && (
        <div className="w-full h-64 bg-black">
          <img
            src={resolveImageUrl(viewPost.images[0])}
            alt="Post"
            className="w-full h-full object-cover"
          />
          {viewPost.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              +{viewPost.images.length - 1} more
            </div>
          )}
        </div>
      )}

      <div className="p-6">

        {/* Header */}
        <h2 className="text-xl font-bold mb-2">{viewPost.topic}</h2>

        {/* Status */}
        <div className="mb-2 text-sm">
          <strong>Status:</strong> {viewPost.status}
        </div>
        <div className="mb-2 text-sm">
          <strong>Scheduled At:</strong>{" "}
          {viewPost.scheduledAt
            ? new Date(viewPost.scheduledAt).toLocaleString()
            : "-"}
        </div>
        <div className="mb-2 text-sm">
          <strong>Posted At:</strong>{" "}
          {viewPost.postedAt
            ? new Date(viewPost.postedAt).toLocaleString()
            : "-"}
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
            {renderPostContent(viewPost.content)}

        </div>

        {/* LinkedIn Link */}
        {viewPost.linkedinPostUrl && (
          <a
            href={viewPost.linkedinPostUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline mt-4 inline-block"
          >
            View on LinkedIn
          </a>
        )}
      </div>
    </div>
  </div>
)}


      {/* Single Schedule Modal */}
      {schedulePostId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold mb-2">Schedule Post</h3>
            <input
              type="datetime-local"
              className="border p-2"
              value={singleScheduleTime}
              onChange={(e) => setSingleScheduleTime(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <button
                className="bg-purple-500 text-white px-3 py-1 rounded"
                onClick={confirmSingleSchedule}
              >
                Confirm
              </button>
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded"
                onClick={() => setSchedulePostId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Schedule Modal */}
{bulkModalOpen && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fadeIn">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          📅 Bulk Schedule Posts
        </h2>
        <button
          onClick={() => setBulkModalOpen(false)}
          className="text-white/80 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={bulkTime}
            onChange={(e) => setBulkTime(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-400 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Posts Per Day
          </label>
          <input
            type="number"
            min="1"
            value={perDay}
            onChange={(e) => setPerDay(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-400 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Manual Start Date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-400 outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 border rounded-lg p-3">
          ⏳ If no date is selected, scheduling starts from <strong>tomorrow</strong>.
        </div>

        <button
          onClick={confirmBulkSchedule}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Confirm Schedule
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}


const renderPostContent = (content) => {
  if (!content) return null;

  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  // Title is first line
  const title = lines[0];

  // Extract hashtags
  const hashtags = lines.filter(l => l.startsWith("#"));

  // Remove hashtags from body
  const body = lines.filter(l => !l.startsWith("#") && l !== title);

  // Find lessons: consecutive short lines at the end
  const lessons = [];
  for (let i = body.length - 1; i >= 0; i--) {
    if (body[i].length < 160) {
      lessons.unshift(body[i]);
    } else {
      break;
    }
  }

  // Remaining paragraphs
  const paragraphs = body.slice(0, body.length - lessons.length);

  return (
    <div className="space-y-4">

      {/* Title */}
      <h3 className="text-l font-bold">{title}</h3>

      {/* Paragraphs */}
      <div className="space-y-2 text-sm leading-relaxed text-gray-800">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Lessons */}
      {lessons.length > 0 && (
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-800">
          {lessons.map((l, i) => (
            <li key={i}>{l.replace(/^[-•*]\s*/, "")}</li>
          ))}
        </ul>
      )}

      {/* Hashtags at bottom */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-blue-600 text-sm mt-2">
          {hashtags.join(" ").split(" ").map((tag, i) => (
            <span key={i} className="cursor-pointer hover:underline">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

