import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import CreateEndpointForm from "../components/CreateEndpointForm";

type Endpoint = {
    id: string;
    name: string;
    url: string;
    method: string;
};

type EndpointStatus = {
    status: "UP" | "DOWN" | "UNKNOWN";
    responseMs: number | null;
    responseCode: number | null;
};

export default function Dashboard() {
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [statuses, setStatuses] = useState<Record<string, EndpointStatus>>({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const endpointsRef = useRef<Endpoint[]>([]);

    useEffect(() => {
        endpointsRef.current = endpoints;
    }, [endpoints]);

    useEffect(() => {
        fetchEndpoints();
    }, []);

    async function fetchEndpoints() {
        try {
            const res = await api.get<Endpoint[]>("/endpoints");
            setEndpoints(res.data);

            const statusPromises = res.data.map(async (ep) => {
                const statusRes = await api.get<EndpointStatus>(`/endpoints/${ep.id}/status`);
                
                return [ep.id, statusRes.data] as const;
            });

            const statusEntries = await Promise.all(statusPromises);
            setStatuses(Object.fromEntries(statusEntries));
        }
        catch (e) {
            console.error("Failed to load endpoints", e);
        }
        finally {
            setLoading(false);
        }
    }

    async function fetchStatus(endpointId: string) {
        try {
            const res = await api.get(`/endpoints/${endpointId}/status`);
            setStatuses((prev) => ({
                ...prev,
                [endpointId]: res.data,
            }));
        }
        catch (e) {
            console.error("Failed to fetch status", e);
        }
    }

    useEffect(() => {
        const interval = setInterval(() => {
            endpointsRef.current.forEach((ep) => {
                fetchStatus(ep.id);
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                Loading endpoints...
            </div>
        );
    }

    async function deleteEndpoint(endpointId: string) {
        const prevEndpoints = endpoints;
        const prevStatuses = statuses;
        
        try {            
            await api.delete(`/endpoints/${endpointId}`);

            setEndpoints((prev) => 
                prev.filter((ep) => ep.id !== endpointId)
            );

            setStatuses((prev) => {
                const copy = { ...prev };
                delete copy[endpointId];
                return copy;
            });
        }
        catch (e) {
            console.error("Failed to delete endpoint", e);
            alert("Failed to delete endpoint");

            setEndpoints(prevEndpoints);
            setStatuses(prevStatuses);
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-2xl font-bold mb-6">
                Your Endpoints
            </h1>

            {showForm && (
                <CreateEndpointForm
                    onClose={() => setShowForm(false)}
                    onCreated={fetchEndpoints}
                />
            )}

            <button onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium">
                + Add Endpoint
            </button>

            {endpoints.length === 0 ? (
                <p className="text-gray-400">No endpoints yet.</p>
            ) : (
                <div className="space-y-4">
                    {endpoints.map((ep) => {
                        const status = statuses[ep.id]?.status ?? "UNKNOWN";

                        return (
                            <div key={ep.id} className="bg-gray-800 p-4 rounded flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium">{ep.name}</p>
                                    <p className="text-sm text-gray-400">{ep.method} {ep.url}</p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        status === "UP"
                                        ? "bg-green-500/20 text-green-400"
                                        : status === "DOWN"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-gray-500/20 text-gray-300"
                                    }`}
                                    >
                                    {status}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => deleteEndpoint(ep.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                    title="Delete Endpoint"
                                >
                                    Delete Endpoint
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}