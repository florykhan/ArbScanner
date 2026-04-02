import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Alerts from "./pages/Alerts";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "events", Component: Events },
      { path: "events/:id", Component: EventDetails },
      { path: "alerts", Component: Alerts },
      { path: "admin", Component: Admin },
      { path: "*", Component: NotFound },
    ],
  },
]);
