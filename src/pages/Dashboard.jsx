import React, { useState } from "react";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";

export default function Dashboard() {
  const [reload, setReload] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">LinkedIn Post Manager</h1>
      <PostForm onPostCreated={() => setReload(!reload)} />
      <PostList key={reload} />
    </div>
  );
}
