import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: {
    month: string;
    Inbound: number;
    Outbound: number;
  }[];
}

const InboundOutboundChart = ({ data }: Props) => {
  const hasData = data && data.length > 0;

  const maxValue = hasData
    ? Math.max(...data.flatMap((d) => [d.Inbound, d.Outbound]))
    : 0;

  return (
    <div>
      {/* ✅ Header ALWAYS visible */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-bold text-dark-grey">
          Inbound & Outbound Transactions
        </h2>
      </div>

      {/* ✅ Chart / Empty State */}
      <div className="h-[240px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, bottom: 10, left: -5 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Months",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#334155",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />

              <YAxis
                tick={{ fontSize: 10, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
                domain={[0, maxValue + 20]}
                label={{
                  value: "Transactions",
                  angle: -90,
                  offset: 10,
                  position: "center",
                  dx: -15,
                  fill: "#334155",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />

              <Tooltip
                contentStyle={{
                  fontSize: 10,
                  padding: "4px 8px",
                }}
                itemStyle={{
                  fontSize: 10,
                }}
              />

              <Legend
                layout="horizontal"
                verticalAlign="top"
                align="right"
                wrapperStyle={{
                  fontSize: 10,
                  color: "#334155",
                }}
              />

              <Line
                type="monotone"
                dataKey="Inbound"
                stroke="#6366f1"
                strokeWidth={1}
                dot={{
                  r: 3,
                  stroke: "#8979FF",
                  strokeWidth: 1,
                  fill: "#8979FF",
                }}
                activeDot={{
                  r: 4.5,
                  stroke: "#8979FF",
                  strokeWidth: 1,
                  fill: "#8979FF",
                }}
              />

              <Line
                type="monotone"
                dataKey="Outbound"
                stroke="#f87171"
                strokeWidth={1}
                dot={{
                  r: 3,
                  stroke: "#FF928A",
                  strokeWidth: 1,
                  fill: "#FF928A",
                }}
                activeDot={{
                  r: 4.5,
                  stroke: "#FF928A",
                  strokeWidth: 1,
                  fill: "#FF928A",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* ✅ Empty state inside chart */
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-grey-400 font-medium">N/A</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboundOutboundChart;
