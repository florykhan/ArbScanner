import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import MarketsPage from "./pages/MarketsPage.jsx";
import SnapshotsPage from "./pages/SnapshotsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="markets" element={<MarketsPage />} />
        <Route path="snapshots" element={<SnapshotsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
