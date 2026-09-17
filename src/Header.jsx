function Header({
  currentUser,
  cartCount,
  activePage,     // "products" | "admin" | "orders" | "cart" | "account" | ""
  onNavigate,     // (page) => void
  onLogout,
  searchValue,    // string - product search text
  onSearchChange, // (value) => void
  showSearch = true, // hide search bar on pages where it isn't needed (e.g. login)
}) {
  const isAdmin = currentUser?.role === "ADMIN";

  const linkStyle = (page) => ({
    background: "transparent",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: activePage === page ? "700" : "500",
    borderBottom: activePage === page ? "2px solid #ffffff" : "2px solid transparent",
    padding: "6px 4px",
  });

  return (
    <header
      className="home-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #2874f0, #1e5fd9)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px",
        padding: "12px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* LOGO */}
      <div style={{ flex: "0 0 auto", cursor: "pointer" }} onClick={() => onNavigate("products")}>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
            color: "#ffffff",
            WebkitTextFillColor: "#ffffff",
            background: "none",
            WebkitBackgroundClip: "unset",
            backgroundClip: "unset",
            letterSpacing: "0.3px",
            textShadow: "0 1px 3px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          🛍️ Sagar E-Shop
        </h1>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "6px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#ffffff",
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.35)",
            padding: "3px 10px",
            borderRadius: "999px",
          }}
        >
          👋 Welcome, {currentUser?.name || "User"}
        </div>
      </div>

      {/* SEARCH BAR - Flipkart style */}
      {showSearch && (
        <div
          style={{
            flex: "1 1 320px",
            maxWidth: "620px",
            position: "relative",
          }}
        >
          <input
            type="text"
            placeholder="Search for products, brands and more"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 40px 10px 14px",
              borderRadius: "4px",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#212121",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#2874f0",
              fontSize: "16px",
            }}
          >
            🔍
          </span>
        </div>
      )}

      {/* NAV ACTIONS */}
      <div
        className="header-actions"
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <button style={linkStyle("products")} onClick={() => onNavigate("products")}>
          Products
        </button>

        {isAdmin && (
          <button style={linkStyle("admin")} onClick={() => onNavigate("admin")}>
            👑 Admin Panel
          </button>
        )}

        <button style={linkStyle("orders")} onClick={() => onNavigate("orders")}>
          Orders
        </button>

        {!isAdmin && (
          <button className="cart-button" style={linkStyle("cart")} onClick={() => onNavigate("cart")}>
            🛒 Cart ({cartCount})
          </button>
        )}

        <button style={linkStyle("account")} onClick={() => onNavigate("account")}>
          👤 My Account
        </button>

        <button
          style={{
            background: "#ffffff",
            color: "#2874f0",
            border: "none",
            borderRadius: "4px",
            padding: "8px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;