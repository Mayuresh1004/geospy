// components/projects/CreateProjectForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export default function CreateProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_topic: "",
    target_urls: [""],
    competitor_urls: [""],
  });

  const addTargetUrl = () => {
    setFormData({
      ...formData,
      target_urls: [...formData.target_urls, ""],
    });
  };

  const removeTargetUrl = (index: number) => {
    setFormData({
      ...formData,
      target_urls: formData.target_urls.filter((_, i) => i !== index),
    });
  };

  const updateTargetUrl = (index: number, value: string) => {
    const newUrls = [...formData.target_urls];
    newUrls[index] = value;
    setFormData({ ...formData, target_urls: newUrls });
  };

  const addCompetitorUrl = () => {
    setFormData({
      ...formData,
      competitor_urls: [...formData.competitor_urls, ""],
    });
  };

  const removeCompetitorUrl = (index: number) => {
    setFormData({
      ...formData,
      competitor_urls: formData.competitor_urls.filter((_, i) => i !== index),
    });
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const newUrls = [...formData.competitor_urls];
    newUrls[index] = value;
    setFormData({ ...formData, competitor_urls: newUrls });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Filter out empty URLs
      const target_urls = formData.target_urls.filter((url) => url.trim());
      const competitor_urls = formData.competitor_urls.filter((url) => url.trim());

      if (target_urls.length === 0) {
        setError("Please add at least one target URL");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          target_topic: formData.target_topic,
          target_urls,
          competitor_urls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      // Redirect to project page
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Project Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Running Shoes SEO Optimization"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Brief description of this project"
        />
      </div>

      {/* Target Topic */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Topic / Question *
        </label>
        <input
          type="text"
          required
          value={formData.target_topic}
          onChange={(e) => setFormData({ ...formData, target_topic: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., What are the best running shoes for beginners?"
        />
        <p className="text-sm text-gray-500 mt-1">
          The main question or topic you want to optimize for
        </p>
      </div>

      {/* Target URLs */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Website URLs *
        </label>
        <p className="text-sm text-gray-500 mb-3">
          The pages you want to optimize
        </p>
        {formData.target_urls.map((url, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateTargetUrl(index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://yourwebsite.com/page"
            />
            {formData.target_urls.length > 1 && (
              <button
                type="button"
                onClick={() => removeTargetUrl(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTargetUrl}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add another URL
        </button>
      </div>

      {/* Competitor URLs */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Competitor URLs (Optional)
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Reference pages to analyze and compare against
        </p>
        {formData.competitor_urls.map((url, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateCompetitorUrl(index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://competitor.com/page"
            />
            <button
              type="button"
              onClick={() => removeCompetitorUrl(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCompetitorUrl}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add competitor URL
        </button>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Project"
          )}
        </Button>
      </div>
    </form>
  );
}