import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import CreateEndpointForm from "../components/CreateEndpointForm";
import { useNavigate } from "react-router-dom";

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

type MeResponse = {
  id: string;
  email: string;
  role: string;
  subscription: {
    plan: {
      name: string;
      maxEndpoints: number;
      checkInterval: number;
      retentionHrs: number;
    };
  } | null;
};

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [statuses, setStatuses] = useState<Record<string, EndpointStatus>>({});
    const [loadingEndpoints, setLoadingEndpoints] = useState(true);
    const [loadingMe, setLoadingMe] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [me, setMe] = useState<MeResponse | null>(null);
    const endpointsRef = useRef<Endpoint[]>([]);
    const navigate = useNavigate();

    function handleLogout() {
        try {
            localStorage.removeItem("token");
            onLogout();
            navigate("/login");
        }
        catch (e) {
            console.error("Failed to logout", e);
        }
    }

    useEffect(() => {
        endpointsRef.current = endpoints;
    }, [endpoints]);

    useEffect(() => {
        fetchEndpoints();
        fetchMe();
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
            setLoadingEndpoints(false);
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

    async function fetchMe() {
        try {
            const res = await api.get<MeResponse>("/auth/me");
            setMe(res.data);
        }
        catch (e) {
            console.error("Failed to fetch user info", e);
        }
        finally {
            setLoadingMe(false);
        }
    }

    const plan = me?.subscription?.plan;
    const limitReached = plan && endpoints.length >= plan.maxEndpoints;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold mb-6">
                    Your Endpoints
                </h1>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    Logout
                </button>
            </div>

            {loadingMe && (
                <div className="mb-6 p-4 bg-gray-800 rounded flex items-center justify-center text-gray-400">
                    Loading user info...
                </div>
            )}

            {!loadingMe && plan && (
                <div className="mb-6 p-4 bg-gray-800 rounded">
                    <p className="text-sm">
                        Plan: <strong>{plan.name}</strong>
                    </p>
                    <p className="text-sm text-gray-400">
                        Endpoints: {endpoints.length} / {plan.maxEndpoints}
                    </p>
                    <p className="text-sm text-gray-400">
                        Checks every {plan.checkInterval} minutes
                    </p>
                </div>
            )}

            {showForm && (
                <CreateEndpointForm
                    onClose={() => setShowForm(false)}
                    onCreated={fetchEndpoints}
                />
            )}

            <button
                disabled={limitReached}
                onClick={() => setShowForm(true)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                    limitReached
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
                + Add Endpoint
            </button>

            {limitReached && (
                <p className="text-sm text-yellow-400 mt-2">
                    You've reached the maximum number of endpoints for the{" "}
                    <strong>{plan?.name}</strong> plan.
                </p>
            )}

            {loadingEndpoints && (
                <div className="flex items-center justify-center text-gray-400 mt-6">
                    Loading endpoints...
                </div>
            )}
            
            {!loadingEndpoints && endpoints.length === 0 ? (
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