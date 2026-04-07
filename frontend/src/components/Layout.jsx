import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? 600 : 400,
  opacity: isActive ? 1 : 0.85
});

export default function Layout() {
  return (
    <div>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "0.75rem 1rem"
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem 1.25rem",
            alignItems: "center"
          }}
        >
          <strong style={{ fontSize: "1.05rem" }}>ArbScanner</strong>
          <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <NavLink to="/" end style={linkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/events" style={linkStyle}>
              Events
            </NavLink>
            <NavLink to="/markets" style={linkStyle}>
              Markets
            </NavLink>
            <NavLink to="/alerts" style={linkStyle}>
              Alerts
            </NavLink>
            <NavLink to="/snapshots" style={linkStyle}>
              Snapshots
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
