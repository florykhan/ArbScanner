import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Events from "./pages/events/Events";
import EventDetails from "./pages/event-details/EventDetails";
import Alerts from "./pages/alerts/Alerts";
import Manage from "./pages/admin/manage/Manage";
import NotFound from "./pages/not-found/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "events", Component: Events },
      { path: "events/:id", Component: EventDetails },
      { path: "alerts", Component: Alerts },
      { path: "admin/manage", Component: Manage },
      { path: "*", Component: NotFound },
    ],
  },
]);
