import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
// import TrendBadge from "../../design-system/TrendBadge";

interface Props {
  data: {
    hour: string;
    value: number;
  }[];
}


const TransactionChart = ({ data }: Props) => {

  const hasData = data && data.length > 0;
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-bold text-dark-grey">Transactions per hour</h2>
        {/* <button className="text-grey-400 text-xl font-bold">⋯</button> */}
      </div>
      {/* Area Chart */}
      { hasData ? (
          <ResponsiveContainer width="100%" height={176}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* ✅ Tooltip on hover */}
              <Tooltip
                cursor={{ stroke: "#ccc", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const item = payload[0]?.payload;
                    if (!item) return null;

                    return (
                      <div className="bg-white shadow px-3 py-2 rounded border border-grey-200 text-xs text-grey-800">
                        <p className="font-medium">{item.hour}</p>
                        <p>{`${item.value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* ✅ Area line + gradient */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                fill="url(#colorGreen)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[240px] flex items-center justify-center">
            <p className="text-sm text-grey-400">data not available</p>
            {/* <p className="text-sm text-grey-300"></p> */}
          </div>
        )
      }

      {/* Bottom Metrics Section */}
      {/* <div className="mt-4 flex justify-between">
        <div>
          <p className="text-[10px] text-light-grey mb-1">This month</p>
          <p className="text-lg font-bold text-dark-grey">$1,450.33</p>
          <div className="inline-flex"><TrendBadge value="1.2%" positive /></div>
        </div>
        <div className="text-left">
          <p className="text-[10px] text-light-grey mb-1">Last month</p>
          <p className="text-lg font-bold text-dark-grey">$2,280.01</p>
          <div className="inline-flex"><TrendBadge value="2.3%" positive={false} /></div>
        </div>
      </div> */}

    </div>
  );
};

export default TransactionChart;

