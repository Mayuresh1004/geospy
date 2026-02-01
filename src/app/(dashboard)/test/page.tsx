// app/(dashboard)/test/page.tsx
"use client";

import { useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFlow = async () => {
    setLoading(true);
    
    try {
      // 1. Create project
      console.log("Creating project...");
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Project",
          target_topic: "best running shoes for beginners",
          target_urls: ["https://example.com"],
          competitor_urls: ["https://competitor.com"],
        }),
      });
      const project = await projectRes.json();
      console.log("✅ Project created:", project);

      // 2. Scrape
      console.log("Scraping...");
      const scrapeRes = await fetch(`/api/projects/${project.project.id}/scrape`, {
        method: "POST",
      });
      const scrapeData = await scrapeRes.json();
      console.log("✅ Scraped:", scrapeData);

      // 3. Generate answer
      console.log("Generating answer...");
      const answerRes = await fetch(
        `/api/projects/${project.project.id}/generate-answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queries: ["What are the best running shoes for beginners?"],
          }),
        }
      );
      const answerData = await answerRes.json();
      console.log("✅ Answer generated:", answerData);

      // 4. Analyze
      console.log("Analyzing...");
      const analyzeRes = await fetch(`/api/projects/${project.project.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_answer_id: answerData.results[0].answer.id,
        }),
      });
      const analyzeData = await analyzeRes.json();
      console.log("✅ Analysis complete:", analyzeData);

      setResult({
        project,
        scrapeData,
        answerData,
        analyzeData,
      });
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Complete Flow</h1>
      
      <button
        onClick={testFlow}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Test"}
      </button>

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}