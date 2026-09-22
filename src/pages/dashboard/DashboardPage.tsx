import StatCard from "../../components/dashboard/StatCard"
import SummaryCard from "../../components/dashboard/SummaryCard"
import TransactionChart from "../../components/dashboard/TransactionChart"
import WelcomeBanner from "../../components/dashboard/WelcomeBanner"
import Card from "../../design-system/Card"
import userAvatar from "../../assets/user-avatar.svg"
// import RecentActivity from "../../components/dashboard/RecentActivity"
// import RecentTransactions from "../../components/dashboard/RecentTransactions"
// import ActionItems from "../../components/dashboard/ActionItems"
import InboundOutboundChart from "../../components/dashboard/InboundOutboundChart"
import { useDashboard } from "../../services/dashboard/dashboardApi"
import { formatCurrency, formatWithSuffix } from "../../utils/formatters"

const DashboardPage = () => {
  // console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);

  const { data, isLoading } = useDashboard();

  if (isLoading) return <div>Loading...</div>;

  const statCards = data?.statCards ?? [];
  const inboundOutboundChartData= data?.inboundOutboundData ?? [] ;
  const TransactionChartData = data?.transactionsPerHour ?? [];

  const todaySale = data?.dashboardTiles?.find(
    (tile) => tile.title === "Today Sale"
  );

  const thisWeek = data?.dashboardTiles?.find(
    (tile) => tile.title === "This Week"
  );

  const todaySaleAmount = todaySale
    ? formatCurrency(todaySale.amount, { currency: "USD" })
    : "N/A";

  const todaySaleChange = todaySale
    ? formatWithSuffix(todaySale.lossOrGain, "%")
    : "N/A";

  const todaySalePositive = todaySale
    ? todaySale.lossOrGain >= 0
    : true;

  const thisWeekAmount = thisWeek
    ? formatCurrency(thisWeek.amount, { currency: "USD" })
    : "N/A";

  const thisWeekChange = thisWeek
    ? formatWithSuffix(thisWeek.lossOrGain, "%")
    : "N/A";

  const thisWeekPositive = thisWeek
    ? thisWeek.lossOrGain >= 0
    : true;
  return (
    <div className="w-full max-w-screen-2xl 2xl:max-w-[2000px] mx-auto">
      <WelcomeBanner />

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-[48%_52%] gap-4 mb-4 items-start">
        <div className="space-y-4">
          <Card className="p-0">
            <SummaryCard
              image={userAvatar}
              salesTodayAmount={todaySaleAmount}
              salesTodayChange={todaySaleChange}
              salesTodayPositive={todaySalePositive}
              salesWeekAmount={thisWeekAmount}
              salesWeekChange={thisWeekChange}
              salesWeekPositive={thisWeekPositive}
            />
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {statCards.map((card) => (
              <Card key={card.title} className="p-4 pr-0">
                <StatCard {...card} />
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="p-4 mr-4">
            {/* Inbound outbound */}
            <InboundOutboundChart data={inboundOutboundChartData}/>
          </Card>
          <Card className="p-4 mr-4 mt-4">
            <TransactionChart data={TransactionChartData}/>
            {/* Transaction Per Chart */}
          </Card>
        </div>

        {/* <Card>
          <RecentActivity />
        </Card> */}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-[48%_52%] gap-4 mb-4">
        {/* <Card className="p-4">
          <TransactionChart data={TransactionChartData}/>
        </Card> */}

        {/* <Card className="p-4">
          <ActionItems />
        </Card> */}

        {/* <Card className="p-4">
          <RecentTransactions />
        </Card> */}
      </div>
    </div>
  );
};


export default DashboardPage
