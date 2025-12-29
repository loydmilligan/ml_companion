import Card from "../components/Card";

export default function LeaderboardPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p>Track points and love across the family league.</p>
      </div>
      <Card>
        <h2>Coming soon</h2>
        <p className="muted">This view will summarize points and voting highlights.</p>
      </Card>
    </div>
  );
}
