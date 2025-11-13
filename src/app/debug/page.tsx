"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { JobKind } from "@/lib/schema";

// Helper to determine if a job type produces an image
const isImageJob = (type: string): boolean => {
  return type === "gpt-image-1-generate" ||
         type === "gpt-image-1-edit" ||
         type === "nano-banana-generate" ||
         type === "nano-banana-edit";
};

// Helper to determine if a job type produces a video
const isVideoJob = (type: string): boolean => {
  return type === "sora-2-video";
};

export default function DebugPage() {
  const [prompt, setPrompt] = useState("A beautiful sunset over mountains");
  const [jobId, setJobId] = useState<string>("");

  // Mutations
  const createJob = api.job.create.useMutation({
    onSuccess: (data) => {
      console.log("Job created:", data);
      setJobId(data.jobId);
    },
    onError: (error) => {
      console.error("Job creation failed:", error);
    },
  });

  // Query for all jobs
  const { data: jobs, refetch } = api.job.list.useQuery(
    { limit: 50 },
    { refetchInterval: 2000 } // Auto-refresh every 2 seconds
  );

  // Test functions for each model
  const testGptImageGen = () => {
    createJob.mutate({
      type: "gpt-image-1-generate",
      model: "gpt-image-1",
      prompt,
      quality: "high",
    });
  };

  const testNanoBananaGen = () => {
    createJob.mutate({
      type: "nano-banana-generate",
      model: "nano-banana",
      prompt,
      aspectRatio: "16:9",
    });
  };

  const testSoraVideo = () => {
    createJob.mutate({
      type: "sora-2-video",
      model: "sora-2",
      prompt,
      seconds: "4",
      size: "1280x720",
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Job API Debug Page</h1>

      <div style={{ marginBottom: "20px", padding: "20px", border: "1px solid #ccc" }}>
        <h2>Create Jobs</h2>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Prompt:
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ width: "100%", padding: "5px", marginTop: "5px" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button onClick={testGptImageGen} disabled={createJob.isPending}>
            GPT Image Gen
          </Button>
          <Button onClick={testNanoBananaGen} disabled={createJob.isPending}>
            Nano Banana Gen
          </Button>
          <Button onClick={testSoraVideo} disabled={createJob.isPending}>
            Sora Video Gen
          </Button>
        </div>

        {createJob.isPending && <p>Creating job...</p>}
        {jobId && <p>Last created job ID: {jobId}</p>}
      </div>

      <div style={{ marginBottom: "20px", padding: "20px", border: "1px solid #ccc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>All Jobs (auto-refreshing)</h2>
          <Button onClick={() => refetch()} size="sm">
            Refresh Now
          </Button>
        </div>

        {jobs && jobs.length === 0 && <p>No jobs yet</p>}

        {jobs && jobs.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  border: "1px solid #ddd",
                  backgroundColor:
                    job.status === "complete"
                      ? "#d4edda"
                      : job.status === "failed"
                      ? "#f8d7da"
                      : job.status === "loading"
                      ? "#fff3cd"
                      : "#e7e7e7",
                }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {job.type} - {job.status.toUpperCase()} ({job.progress}%)
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  ID: {job.id}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Created: {new Date(job.createdAt).toLocaleString()}
                </div>
                {job.error && (
                  <div style={{ color: "red", marginTop: "5px" }}>
                    Error: {job.error}
                  </div>
                )}
                {job.result && (
                  <div style={{ marginTop: "5px" }}>
                    <strong>Result:</strong>
                    <pre style={{ fontSize: "11px", maxWidth: "100%", overflow: "auto" }}>
                      {JSON.stringify(job.result, null, 2)}
                    </pre>
                    {/* Display based on job type output */}
                    {isImageJob(job.type) && (job.result as any).imageUrl && (
                      <img
                        src={(job.result as any).imageUrl}
                        alt="Generated"
                        style={{ maxWidth: "300px", marginTop: "10px" }}
                      />
                    )}
                    {isVideoJob(job.type) && (job.result as any).videoUrl && (
                      <video
                        src={(job.result as any).videoUrl}
                        controls
                        style={{ maxWidth: "300px", marginTop: "10px" }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
