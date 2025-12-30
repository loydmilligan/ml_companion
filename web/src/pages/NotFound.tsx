import { Link } from "react-router-dom";
import Card from "../components/Card";

export default function NotFound() {
  return (
    <div className="page">
      <Card>
        <h1>Page not found</h1>
        <p className="muted">Let’s get you back to the league.</p>
        <Link className="text-link" to="/app/chat">
          Go to chat
        </Link>
      </Card>
    </div>
  );
}
