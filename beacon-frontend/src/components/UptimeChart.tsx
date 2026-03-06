import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


type Check = {
    checkedAt: string;
    responseMs: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: {
    payload: Check;
  }[];
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
            <div className="bg-gray-200 text-blue-600 px-3 py-2 rounded shadow">
                <p>Date & Time:{" "} {new Date(data.checkedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "medium",
                    })}
                </p>
                <p>Response Time: {data.responseMs} ms</p>
            </div>
            );
        }

        return null;
    };

export default function UptimeChart({ data }: { data: Check[] }) {
    
    const sortedData = [...data].sort(
        (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime()
    );
    
    return (
        <div className="bg-gray-800 p-4 rounded mt-4">
            <h3 className="text-white mb-2">Response Time</h3>

            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sortedData}>
                    <XAxis
                        dataKey="checkedAt"
                        tickFormatter={(t) =>
                            new Date(t).toLocaleTimeString()
                        }
                        minTickGap={30}
                    />

                    <YAxis />

                    <Tooltip content={<CustomTooltip/>} />

                    <Line
                        type="monotone"
                        dataKey="responseMs"
                        stroke="#3b82f6"
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}