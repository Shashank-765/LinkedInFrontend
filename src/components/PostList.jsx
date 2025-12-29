import React, { useState, useEffect } from "react";
import {
  fetchPosts,
  approvePost,
  schedulePost,
  bulkSchedulePosts,
} from "../api";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTime, setBulkTime] = useState(""); // start time
  const [perDay, setPerDay] = useState(1); // posts per day
  const [manualDate, setManualDate] = useState(""); // manual date
  const [viewPost, setViewPost] = useState(null); // for view modal
  const [schedulePostId, setSchedulePostId] = useState(null); // for single schedule
  const [singleScheduleTime, setSingleScheduleTime] = useState(""); // single schedule time

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
  }, []);

  const toggleSelectPost = (id) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Approve post
  const handleApprove = async (id) => {
    await approvePost(id);
    loadPosts();
  };

  // Open single schedule modal
  const openScheduleModal = (id) => {
    setSchedulePostId(id);
    setSingleScheduleTime("");
  };

  // Confirm single schedule
  const confirmSingleSchedule = async () => {
    if (!singleScheduleTime) return alert("Please select a time");
    await schedulePost(schedulePostId, singleScheduleTime);
    setSchedulePostId(null);
    setSingleScheduleTime("");
    loadPosts();
  };

  // Confirm bulk schedule
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Posts</h2>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-3">
        {["all", "pending", "approved", "scheduled", "posted", "failed"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded ${
                filter === f ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {f}
            </button>
          )
        )}
      </div>

      {/* Bulk Schedule Button */}
      {selectedPosts.length > 0 && (
        <button
          className="mb-3 bg-purple-600 text-white px-3 py-1 rounded"
          onClick={() => setBulkModalOpen(true)}
        >
          Schedule {selectedPosts.length} Posts
        </button>
      )}

      {/* Posts Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Select</th>
              <th className="p-2 border">Topic</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Scheduled</th>
              <th className="p-2 border">Posted</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post._id} className="border-t">
                <td className="p-2 text-center">
                  {post.status === "approved" && (
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post._id)}
                      onChange={() => toggleSelectPost(post._id)}
                    />
                  )}
                </td>
                <td className="p-2">{post.topic}</td>
                <td className="p-2">{post.status}</td>
                <td className="p-2">
                  {post.scheduledAt
                    ? new Date(post.scheduledAt).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2">
                  {post.postedAt
                    ? new Date(post.postedAt).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2 flex gap-2 flex-wrap">
                  {post.status === "pending" && (
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded"
                      onClick={() => handleApprove(post._id)}
                    >
                      Approve
                    </button>
                  )}
                  {post.status === "approved" && (
                    <button
                      className="bg-purple-500 text-white px-2 py-1 rounded"
                      onClick={() => openScheduleModal(post._id)}
                    >
                      Schedule
                    </button>
                  )}
                  <button
                    className="bg-gray-500 text-white px-2 py-1 rounded"
                    onClick={() => setViewPost(post)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Bulk Schedule Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setBulkModalOpen(false)}
            >
              ✖
            </button>
            <h2 className="text-lg font-bold mb-4">Bulk Schedule</h2>

            <label className="block mb-2">Start Time:</label>
            <input
              type="time"
              value={bulkTime}
              onChange={(e) => setBulkTime(e.target.value)}
              className="border p-2 w-full mb-4"
            />

            <label className="block mb-2">Posts Per Day:</label>
            <input
              type="number"
              min="1"
              value={perDay}
              onChange={(e) => setPerDay(e.target.value)}
              className="border p-2 w-full mb-4"
            />

            <label className="block mb-2">Manual Start Date (optional):</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="border p-2 w-full mb-4"
            />

            <p className="text-sm text-gray-500 mb-4">
              If no manual date is selected, scheduling will start from{" "}
              <strong>tomorrow</strong>.
            </p>

            <button
              className="bg-purple-500 text-white px-4 py-2 rounded w-full"
              onClick={confirmBulkSchedule}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Single Schedule Modal */}
      {schedulePostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setSchedulePostId(null)}
            >
              ✖
            </button>
            <h2 className="text-lg font-bold mb-4">Schedule Post</h2>
            <input
              type="datetime-local"
              value={singleScheduleTime}
              onChange={(e) => setSingleScheduleTime(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded w-full"
              onClick={confirmSingleSchedule}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
{/* View Modal */}
{viewPost && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-lg relative overflow-y-auto max-h-[90vh]">
      {/* Close Button */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={() => setViewPost(null)}
      >
        ✖
      </button>

      {/* Header */}
      <h2 className="text-xl font-bold mb-4">{viewPost.topic}</h2>

      {/* Status */}
      <div className="mb-2">
        <strong>Status:</strong> {viewPost.status}
      </div>
      <div className="mb-2">
        <strong>Scheduled At:</strong>{" "}
        {viewPost.scheduledAt
          ? new Date(viewPost.scheduledAt).toLocaleString()
          : "-"}
      </div>
      <div className="mb-2">
        <strong>Posted At:</strong>{" "}
        {viewPost.postedAt
          ? new Date(viewPost.postedAt).toLocaleString()
          : "-"}
      </div>

      {/* Content (headline + pointers) */}
      <div className="mb-4">
        <strong>Content:</strong>
        <div className="mt-2 space-y-4">
          {viewPost.content
            ?.split(/\n(?=[A-Z].*?:)/) // split on "Heading:" style lines
            .filter(Boolean)
            .map((section, idx) => {
              const [heading, ...points] = section.trim().split("\n").map(s => s.trim());
              return (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-gray-100 border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-800">{heading}</h3>
                  <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                    {points.map((pt, i) => (
                      <li key={i}>{pt.replace(/^[-•]\s*/, "")}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      </div>

      {/* Images */}
      {viewPost.images && viewPost.images.length > 0 && (
  <div className="flex gap-2 flex-wrap mb-4">
    {viewPost.images.map((img, idx) => (
      <img
        key={idx}
        src={img}
        alt="Post"
        className="w-20 h-20 object-cover rounded border"
      />
    ))}
  </div>
)}

      {/* LinkedIn Link */}
      {viewPost.linkedinPostUrl && (
        <a
          href={viewPost.linkedinPostUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline mt-2 inline-block"
        >
          View on LinkedIn
        </a>
      )}
    </div>
  </div>
)}




    </div>
  );
}
