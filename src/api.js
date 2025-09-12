import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000", // backend URL
});

// --- API functions ---
export const fetchPosts = () => API.get("/posts");
export const generatePost = (topic,autoApprove) => API.post("/posts/generate", { topic , autoApprove});
export const getTrendingTopics = () => API.get("/posts/trending-topics");
export const bulkSchedulePosts = ({ ids, startTime, perDay, manualDate }) => {
  return API.post("/posts/bulk-schedule", {
    ids, // must be array
    startTime,
    perDay: Number(perDay), // ensure it's a number
    manualDate,
  }).then((res) => res.data);
};
export const approvePost = (id) => API.post(`/posts/approve/${id}`);
export const schedulePost = (id, scheduledAt, autoApprove = false) =>
  API.post(`/posts/schedule/${id}`, { scheduledAt, autoApprove });

export default API;
