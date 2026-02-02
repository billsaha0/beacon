import { useState } from "react";
import api from "../api/client";
import { AxiosError } from "axios";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateEndpointForm({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/endpoints", {
        name,
        url,
        method,
      });

      onCreated();   // refresh list
      onClose();     // close form
    }
    catch (err: unknown) {
  if (err instanceof AxiosError) {
    setError(
      (err.response?.data as { message?: string })?.message ||
        "Failed to create endpoint"
    );
  } else {
    setError("Failed to create endpoint");
  }
}

    
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Add Endpoint</h2>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-2 rounded">
            {error}
          </div>
        )}

        <input
          className="w-full p-2 rounded bg-gray-700"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="w-full p-2 rounded bg-gray-700"
          placeholder="https://api.example.com/health"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <label className="block text-sm text-gray-300">
            HTTP Method
            <select
                className="w-full p-2 mt-1 rounded bg-gray-700"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
            >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
            </select>
        </label>


        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
