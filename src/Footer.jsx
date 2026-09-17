function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        marginTop: "40px",
        padding: "24px 20px",
        textAlign: "center",
        borderTop: "1px solid #e5e7eb",
        color: "#64748b",
        fontSize: "14px",
      }}
    >
      <div style={{ marginBottom: "8px", fontWeight: 600, color: "#334155" }}>
        Sagar E-Shop
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "10px" }}>
        <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>About Us</a>
        <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>Contact</a>
        <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</a>
        <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>Terms &amp; Conditions</a>
      </div>

      <div>
        © {year} Sagar E-Shop. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;