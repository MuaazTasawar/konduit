"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/traces", label: "Traces" },
  { href: "/logs", label: "Logs" },
  { href: "/anomalies", label: "Anomalies" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          height: "56px",
          gap: "2rem",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--accent)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              color: "white",
            }}
          >
            K
          </div>
          <span
            style={{
              fontWeight: "700",
              fontSize: "1rem",
              color: "var(--text-primary)",
              letterSpacing: "0.05em",
            }}
          >
            KONDUIT
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginLeft: "4px",
            }}
          >
            Observability
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: "0.25rem", flex: 1 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? "600" : "400",
                  color: isActive
                    ? "var(--accent-bright)"
                    : "var(--text-secondary)",
                  background: isActive ? "var(--accent-glow)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(59,130,246,0.3)"
                    : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="pulse-dot" />
          <span
            style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
          >
            LIVE
          </span>
        </div>
      </div>
    </nav>
  );
}