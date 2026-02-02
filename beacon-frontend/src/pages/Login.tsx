import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Login({ onLogin }: { onLogin: () => void }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        try {
            const res = await api.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);

            onLogin();
            
            navigate("/");
        }
        catch {
            setError("Invalid Credentials");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded w-full max-w-sm">
                <h1 className="text-white text-2xl mb-6">
                    Login
                </h1>
                
                {error && <p className="text-red-400 mb-4">{error}</p>}

                <input
                    className="w-full p-2 mb-3 bg-gray-700 text-white rounded"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="w-full p-2 mb-6 bg-gray-700 text-white rounded"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" className="w-full bg-blue-600 py-2 rounded text-white">
                    Sign in
                </button>

            </form>
        </div>
    );
}