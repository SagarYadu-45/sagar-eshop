import { useEffect, useState } from "react";
import "./App.css";
import "./MyOrders.css";
import AdminPanel from "./AdminPanel";
import AdminOrders from "./AdminOrders";
import Header from "./Header";
import Footer from "./Footer";
import Checkout from "./Checkout";

const API = "http://localhost:8080";

function App() {
  // =====================================================
  // LOGIN / REGISTER STATE
  // =====================================================

  const [isRegister, setIsRegister] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("User parse error:", error);
        localStorage.removeItem("user");
      }
    }

    return null;
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =====================================================
  // PRODUCTS
  // =====================================================

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  // =====================================================
  // CART
  // =====================================================

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // =====================================================
  // ORDERS
  // =====================================================

  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [returnLoading, setReturnLoading] = useState(null);

  // =====================================================
  // ORDER SUCCESS
  // =====================================================

  const [orderSuccess, setOrderSuccess] = useState(null);

  // =====================================================
  // TRACKING
  // =====================================================

  const [trackingOrder, setTrackingOrder] = useState(null);

  // =====================================================
  // ADMIN
  // =====================================================

  const [showAdmin, setShowAdmin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const isLoggedIn = currentUser !== null;

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    let value = String(image).trim();

    // Backslash ko slash me convert
    value = value.replace(/\\/g, "/");

    // Already complete URL
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    // /uploads/filename
    if (value.startsWith("/uploads/")) {
      return `${API}${value}`;
    }

    // uploads/filename
    if (value.startsWith("uploads/")) {
      return `${API}/${value}`;
    }

    // Only filename
    return `${API}/uploads/${encodeURIComponent(value)}`;
  };

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem("token");
    return {
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API}/api/products?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: getAuthHeaders({
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }),
      });

      if (!response.ok) {
        throw new Error("Products fetch failed");
      }

      const data = await response.json();

      console.log("Products:", data);

      setProducts(data);
    } catch (error) {
      console.error("Product error:", error);
      alert("Unable to load products.");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadProducts();
    }
  }, [isLoggedIn]);

  // =====================================================
  // LOAD USER ORDERS
  // =====================================================

  const loadOrders = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/orders/user/${currentUser.id}?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders({
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Orders fetch failed");
      }

      const data = await response.json();

      console.log("Latest Customer Orders:", data);

      setOrders(data);

      // Agar tracking page open hai to uska status bhi update karo
      setTrackingOrder((previousOrder) => {
        if (!previousOrder) {
          return previousOrder;
        }

        const latestOrder = data.find(
          (order) => order.id === previousOrder.id
        );

        return latestOrder || previousOrder;
      });
    } catch (error) {
      console.error("Orders error:", error);
    }
  };

  // =====================================================
  // AUTO REFRESH ORDER STATUS
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      return;
    }

    if (!showOrders && !trackingOrder) {
      return;
    }

    // Page open hote hi latest status fetch
    loadOrders();

    // Har 5 seconds latest status check
    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    isLoggedIn,
    currentUser?.id,
    showOrders,
    trackingOrder?.id,
  ]);

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isRegister
      ? `${API}/api/users/register`
      : `${API}/api/users/login`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isRegister
            ? {
                name,
                email,
                password,
              }
            : {
                email,
                password,
              }
        ),
      });

      // =================================================
      // REGISTER
      // =================================================

      if (isRegister) {
        if (response.ok) {
          alert("Registration successful! Please login.");

          setIsRegister(false);
          setName("");
          setEmail("");
          setPassword("");
        } else {
          const result = await response.text();

          console.log("Registration error:", result);

          alert(result || "Registration failed.");
        }

        return;
      }

      // =================================================
      // LOGIN
      // =================================================

      const result = await response.json();

      console.log("Login response:", result);

      if (response.ok) {
        const user = {
          id: result.id,
          name: result.name,
          email: result.email,
          role: result.role,
        };

        console.log("Logged in user:", user);

        if (result.token) {
          localStorage.setItem("token", result.token);
        }

        localStorage.setItem("user", JSON.stringify(user));

        setCurrentUser(user);

        setShowAdmin(false);
        setShowCart(false);
        setShowOrders(false);
        setOrderSuccess(null);
        setTrackingOrder(null);

        setPassword("");

        alert(`Welcome ${user.name}!`);
      } else {
        alert("Invalid email or password");
      }
    } catch (error) {
      console.error("Login/Register error:", error);

      alert("Unable to connect to the backend server.");
    }
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      alert("This product is out of stock.");
      return;
    }

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        if (existingProduct.cartQuantity >= product.quantity) {
          alert("You cannot add more than available stock.");
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                cartQuantity: item.cartQuantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          cartQuantity: 1,
        },
      ];
    });
  };

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id === id) {
          if (item.cartQuantity >= item.quantity) {
            alert("Available stock limit reached.");
            return item;
          }

          return {
            ...item,
            cartQuantity: item.cartQuantity + 1,
          };
        }

        return item;
      })
    );
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decreaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                cartQuantity: item.cartQuantity - 1,
              }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount = cart.reduce(
    (total, item) => total + item.cartQuantity,
    0
  );

  // =====================================================
  // CART TOTAL
  // =====================================================

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.cartQuantity,
    0
  );

  // =====================================================
  // CANCEL ORDER - USER + ADMIN
  // =====================================================

  const handleCancelOrder = async (orderId) => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${orderId}?`
    );

    if (!confirmed) return;

    const reason = window.prompt(
      "Please enter the reason for cancelling this order:"
    );

    if (!reason || !reason.trim()) {
      alert("Cancellation reason is required.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/orders/${orderId}/cancel`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            reason: reason.trim(),
          }),
        }
      );

      const resultText = await response.text();

      if (!response.ok) {
        alert(resultText || "Order cancellation failed.");
        return;
      }

      alert(`Order #${orderId} cancelled successfully.`);
      await loadOrders();
      await loadProducts();
    } catch (error) {
      console.error("Cancel order error:", error);
      alert("Backend server se connection nahi ho raha.");
    }
  };

  // =====================================================
  // RETURN ORDER - USER
  // =====================================================

  const handleReturnOrder = async (orderId) => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    const order = orders.find(
      (item) => Number(item.id) === Number(orderId)
    );

    if (!order) {
      alert("Order not found.");
      return;
    }

    const deliveredAt = order.deliveredAt;

    if (!deliveredAt) {
      alert("Return period information is not available for this order.");
      return;
    }

    const deliveredTime = new Date(deliveredAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (Number.isNaN(deliveredTime) || Date.now() - deliveredTime > sevenDays) {
      alert("Return period has expired. Returns are available only within 7 days of delivery.");
      return;
    }

    const reason = window.prompt(
      "Please enter the reason for returning this order:"
    );

    if (!reason || !reason.trim()) {
      alert("Return reason is required.");
      return;
    }

    try {
      setReturnLoading(orderId);

      const response = await fetch(
        `${API}/api/orders/${orderId}/return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            reason: reason.trim(),
          }),
        }
      );

      const resultText = await response.text();

      if (!response.ok) {
        alert(resultText || "Return request failed.");
        return;
      }

      alert(`Return request for Order #${orderId} submitted successfully.`);
      await loadOrders();
    } catch (error) {
      console.error("Return order error:", error);
      alert("Backend server se connection nahi ho raha.");
    } finally {
      setReturnLoading(null);
    }
  };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const placeOrder = async (checkoutData = null) => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return false;
    }

    if (!currentUser) {
      alert("Please login first.");
      return false;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Your login session has expired. Please login again.");
      logout();
      return false;
    }

    try {
      const response = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          userId: currentUser.id,
          totalAmount: cartTotal,
          status: "PLACED",
          customerName: checkoutData?.customerName || currentUser.name || "",
          phone: checkoutData?.phone || "",
          address: checkoutData?.address || "",
          city: checkoutData?.city || "",
          state: checkoutData?.state || "",
          pincode: checkoutData?.pincode || "",
          paymentMethod: checkoutData?.paymentMethod || "COD",
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.cartQuantity,
            price: Number(item.price),
          })),
        }),
      });

      const resultText = await response.text();
      console.log("Order response:", resultText);

      if (!response.ok) {
        console.error("Order failed:", resultText);
        alert(resultText || "Unable to place the order.");
        return false;
      }

      let createdOrder = null;
      try {
        createdOrder = JSON.parse(resultText);
      } catch (error) {
        console.error("Order JSON parse error:", error);
      }

      setOrderSuccess({
        id: createdOrder?.id || null,
        totalAmount: createdOrder?.totalAmount ?? cartTotal,
        status: createdOrder?.status || "PLACED",
      });

      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setShowOrders(false);
      setShowAdmin(false);
      setShowAccount(false);
      setTrackingOrder(null);

      await loadProducts();
      await loadOrders();
      return true;
    } catch (error) {
      console.error("Order error:", error);
      alert("Unable to connect to the backend server.");
      return false;
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setCurrentUser(null);

    setShowCart(false);
    setShowOrders(false);
    setShowAdmin(false);
    setShowAccount(false);

    setOrderSuccess(null);
    setTrackingOrder(null);

    setCart([]);

    setName("");
    setEmail("");
    setPassword("");
  };

  // =====================================================
  // NAVIGATE (centralized page-switch logic used by <Header />)
  // =====================================================

  const navigateTo = (page) => {
    setShowAdmin(false);
    setShowOrders(false);
    setShowCart(false);
    setShowCheckout(false);
    setShowAccount(false);
    setOrderSuccess(null);
    setTrackingOrder(null);

    if (page === "admin") {
      setShowAdmin(true);
    } else if (page === "orders") {
      loadOrders();
      setShowOrders(true);
    } else if (page === "cart") {
      setShowCart(true);
    } else if (page === "checkout") {
      if (cart.length === 0) {
        setShowCart(true);
        return;
      }
      setShowCheckout(true);
    } else if (page === "account") {
      setShowAccount(true);
    }
    // "products" needs no extra flag, resets above already land us there
  };

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();

    return (
      product.name?.toLowerCase().includes(searchText) ||
      product.description?.toLowerCase().includes(searchText)
    );
  });

  // =====================================================
  // ADMIN ORDERS PAGE
  // =====================================================

  if (
    isLoggedIn &&
    currentUser?.role === "ADMIN" &&
    showOrders
  ) {
    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="orders"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <AdminOrders currentUser={currentUser} />

        <Footer />

      </div>
    );
  }

  // =====================================================
  // ADMIN PANEL
  // =====================================================

  if (
    isLoggedIn &&
    currentUser?.role === "ADMIN" &&
    showAdmin
  ) {
    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="admin"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <AdminPanel />

        <Footer />

      </div>
    );
  }

  // =====================================================
  // ORDER SUCCESS PAGE
  // =====================================================

  if (isLoggedIn && orderSuccess) {
    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage=""
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <main className="order-success-container">

          <div className="order-success-card">

            <div className="success-icon">
              ✓
            </div>

            <h2>
              Order Confirmed!
            </h2>

            <p className="success-message">
              Your order has been placed successfully.
            </p>

            {orderSuccess.id && (
              <p className="success-order-id">
                Order #{orderSuccess.id}
              </p>
            )}

            <div className="success-amount">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {Number(
                  orderSuccess.totalAmount
                ).toLocaleString("en-IN")}
              </strong>

            </div>

            <div className="success-status">

              <span>
                Current Status
              </span>

              <strong>
                {orderSuccess.status}
              </strong>

            </div>

            <div className="success-actions">

              {orderSuccess.id && (
                <button
                  className="track-order-button"
                  onClick={async () => {

                    try {

                      const response = await fetch(
                        `${API}/api/orders/user/${currentUser.id}?t=${Date.now()}`,
                        {
                          method: "GET",
                          cache: "no-store",
                          headers: getAuthHeaders({
                            "Cache-Control":
                              "no-cache",
                            Pragma: "no-cache",
                          }),
                        }
                      );

                      if (!response.ok) {
                        throw new Error(
                          "Orders fetch failed"
                        );
                      }

                      const latestOrders =
                        await response.json();

                      const order =
                        latestOrders.find(
                          (item) =>
                            item.id ===
                            orderSuccess.id
                        );

                      if (order) {
                        setTrackingOrder(order);
                      } else {
                        setTrackingOrder({
                          id: orderSuccess.id,
                          totalAmount:
                            orderSuccess.totalAmount,
                          status:
                            orderSuccess.status,
                          userId:
                            currentUser.id,
                        });
                      }

                      setOrderSuccess(null);
                      setShowOrders(false);
                      setShowCart(false);
                      setShowAdmin(false);

                    } catch (error) {

                      console.error(
                        "Track order error:",
                        error
                      );

                      setTrackingOrder({
                        id: orderSuccess.id,
                        totalAmount:
                          orderSuccess.totalAmount,
                        status:
                          orderSuccess.status,
                        userId:
                          currentUser.id,
                      });

                      setOrderSuccess(null);
                    }
                  }}
                >
                  🚚 Track My Order
                </button>
              )}

              <button
                className="my-orders-button"
                onClick={() => {

                  setOrderSuccess(null);
                  setTrackingOrder(null);

                  loadOrders();

                  setShowOrders(true);
                  setShowCart(false);
                  setShowAdmin(false);
                }}
              >
                📦 My Orders
              </button>

              <button
                className="continue-shopping-button"
                onClick={() => {

                  setOrderSuccess(null);
                  setTrackingOrder(null);

                  setShowOrders(false);
                  setShowCart(false);
                  setShowAdmin(false);
                }}
              >
                Continue Shopping
              </button>

            </div>

          </div>

        </main>

        <Footer />

      </div>
    );
  }

  // =====================================================
  // TRACK ORDER PAGE
  // =====================================================

  if (isLoggedIn && trackingOrder) {

    const trackingSteps = [
      {
        status: "PLACED",
        title: "Order Placed",
        description:
          "Your order has been placed",
      },
      {
        status: "PROCESSING",
        title: "Processing",
        description:
          "Your order is being prepared",
      },
      {
        status: "SHIPPED",
        title: "Shipped",
        description:
          "Your order is on the way",
      },
      {
        status: "DELIVERED",
        title: "Delivered",
        description:
          "Order delivered successfully",
      },
    ];

    const statusOrder = [
      "PLACED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ];

    const currentStatusIndex =
      statusOrder.indexOf(
        trackingOrder.status
      );

    const isCancelled =
      trackingOrder.status === "CANCELLED";

    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage=""
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <main className="order-tracking-container">

          <div className="tracking-header">

            <div>

              <h2>
                🚚 Track My Order
              </h2>

              <p>
                Order #{trackingOrder.id}
              </p>

            </div>

            <button
              className="refresh-status-button"
              onClick={async () => {

                try {

                  const response = await fetch(
                    `${API}/api/orders/user/${currentUser.id}?t=${Date.now()}`,
                    {
                      method: "GET",
                      cache: "no-store",
                      headers: getAuthHeaders({
                        "Cache-Control":
                          "no-cache",
                        Pragma: "no-cache",
                      }),
                    }
                  );

                  if (!response.ok) {
                    throw new Error(
                      "Order refresh failed"
                    );
                  }

                  const data =
                    await response.json();

                  setOrders(data);

                  const latestOrder =
                    data.find(
                      (item) =>
                        item.id ===
                        trackingOrder.id
                    );

                  if (latestOrder) {
                    setTrackingOrder(
                      latestOrder
                    );
                  }

                } catch (error) {

                  console.error(
                    "Status refresh error:",
                    error
                  );

                }

              }}
            >
              🔄 Refresh Status
            </button>

          </div>

          <div className="tracking-order-summary">

            <div>

              <span>
                Order ID
              </span>

              <strong>
                #{trackingOrder.id}
              </strong>

            </div>

            <div>

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {Number(
                  trackingOrder.totalAmount
                ).toLocaleString("en-IN")}
              </strong>

            </div>

            <div>

              <span>
                Current Status
              </span>

              <strong>
                {trackingOrder.status}
              </strong>

            </div>

          </div>

          {isCancelled ? (

            <div className="cancelled-order-box">

              <div className="cancelled-icon">
                ✕
              </div>

              <h3>
                Order Cancelled
              </h3>

              <p>
                This order has been cancelled.
              </p>

            </div>

          ) : (

            <div className="tracking-card">

              <h3>
                📦 Order Tracking
              </h3>

              <div className="tracking-progress">

                {trackingSteps.map(
                  (step, index) => {

                    const isCompleted =
                      currentStatusIndex >=
                      index;

                    const isCurrent =
                      currentStatusIndex ===
                      index;

                    return (
                      <div
                        className={`tracking-step ${
                          isCompleted
                            ? "completed"
                            : ""
                        } ${
                          isCurrent
                            ? "current"
                            : ""
                        }`}
                        key={step.status}
                      >

                        <div className="step-number">

                          {isCompleted
                            ? "✓"
                            : index + 1}

                        </div>

                        <div className="step-content">

                          <h4>
                            {step.title}
                          </h4>

                          <p>
                            {step.description}
                          </p>

                        </div>

                      </div>
                    );

                  }
                )}

              </div>

            </div>

          )}

          <div className="tracking-actions">

            <button
              onClick={() => {
                setTrackingOrder(null);
                loadOrders();

                setShowOrders(true);
                setShowCart(false);
                setShowAdmin(false);
              }}
            >
              📦 My Orders
            </button>

            <button
              onClick={() => {
                setTrackingOrder(null);

                setShowOrders(false);
                setShowCart(false);
                setShowAdmin(false);
              }}
            >
              Continue Shopping
            </button>

          </div>

        </main>

        <Footer />

      </div>
    );
  }

  // =====================================================
  // CART PAGE
  // =====================================================

  if (isLoggedIn && showCart) {
    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="cart"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <main className="cart-container">

          <h2>
            Your Cart
          </h2>

          {cart.length === 0 ? (

            <div className="empty-cart">

              <h3>
                Your cart is empty 🛒
              </h3>

              <button
                onClick={() =>
                  setShowCart(false)
                }
              >
                Continue Shopping
              </button>

            </div>

          ) : (

            <>

              <div className="cart-items">

                {cart.map((item) => (

                  <div
                    className="cart-item"
                    key={item.id}
                  >

                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      onError={(e) => {

                        console.error(
                          "Cart image failed:",
                          item.image,
                          getImageUrl(
                            item.image
                          )
                        );

                        e.currentTarget.style.display =
                          "none";
                      }}
                    />

                    <div className="cart-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        {item.description}
                      </p>

                      <strong>
                        ₹
                        {Number(
                          item.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    <div className="quantity-controls">

                      <button
                        onClick={() =>
                          decreaseQuantity(
                            item.id
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.cartQuantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(
                            item.id
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                    <button
                      className="remove-button"
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      Remove
                    </button>

                  </div>

                ))}

              </div>

              <div className="cart-summary">

                <h3>
                  Cart Summary
                </h3>

                <p>
                  Total Items:{" "}
                  <strong>
                    {cartCount}
                  </strong>
                </p>

                <h2>
                  Total: ₹
                  {cartTotal.toLocaleString(
                    "en-IN"
                  )}
                </h2>

                <button
                  className="checkout-button"
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please login first.");
                      return;
                    }
                    if (cart.length === 0) {
                      alert("Your cart is empty.");
                      return;
                    }
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                >
                  Proceed to Checkout
                </button>

              </div>

            </>

          )}

        </main>

        <Footer />

      </div>
    );
  }

  // =====================================================
  // CHECKOUT PAGE
  // =====================================================

  if (isLoggedIn && showCheckout) {
    return (
      <div className="home-container">
        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="checkout"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <Checkout
          currentUser={currentUser}
          cart={cart}
          cartTotal={cartTotal}
          cartCount={cartCount}
          getImageUrl={getImageUrl}
          onBackToCart={() => {
            setShowCheckout(false);
            setShowCart(true);
          }}
          onPlaceOrder={placeOrder}
        />

        <Footer />
      </div>
    );
  }

  // =====================================================
  // MY ACCOUNT PAGE
  // =====================================================

  if (isLoggedIn && showAccount) {
    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="account"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <main className="products-container">
          <div
            style={{
              maxWidth: "700px",
              margin: "30px auto",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>👤 My Account</h2>

            <div style={{ marginTop: "25px", lineHeight: 1.9 }}>
              <p><strong>Name:</strong> {currentUser?.name || "User"}</p>
              <p><strong>Email:</strong> {currentUser?.email || "-"}</p>
              <p><strong>Role:</strong> {currentUser?.role || "USER"}</p>
              <p><strong>User ID:</strong> {currentUser?.id || "-"}</p>
            </div>

            <div style={{ marginTop: "25px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  loadOrders();
                  setShowAccount(false);
                  setShowOrders(true);
                }}
              >
                📦 View My Orders
              </button>

              <button
                onClick={() => {
                  setShowAccount(false);
                  setShowCart(true);
                }}
              >
                🛒 View Cart
              </button>
            </div>
          </div>
        </main>

        <Footer />

      </div>
    );
  }

  // =====================================================
  // NORMAL USER ORDERS PAGE
  // =====================================================

  if (isLoggedIn && currentUser?.role !== "ADMIN" && showOrders) {
    return (
      <div className="home-container">
        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="orders"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <main className="my-orders-page">
          <div className="my-orders-header">
            <div>
              <h2>📦 My Orders</h2>
              <p>View your orders, delivery status and return options.</p>
            </div>
            <button className="refresh-status-button" onClick={loadOrders}>
              🔄 Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="my-orders-empty">
              <div className="my-orders-empty-icon">📦</div>
              <h3>No orders found</h3>
              <p>You have not placed any orders yet.</p>
              <button onClick={() => navigateTo("products")}>Continue Shopping</button>
            </div>
          ) : (
            <div className="my-orders-list">
              {orders.map((order) => {
                const status = String(order.status || "PLACED").toUpperCase();
                const isCancelled = status === "CANCELLED";
                const isDelivered = status === "DELIVERED";
                const isReturned = status === "RETURNED";
                const canCancel = !isCancelled && !isDelivered && !isReturned && status !== "SHIPPED";
                const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : NaN;
                const returnWindowOpen = isDelivered && (Number.isNaN(deliveredTime) || Date.now() - deliveredTime <= 7 * 24 * 60 * 60 * 1000);
                const steps = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
                const currentIndex = steps.indexOf(status);

                return (
                  <article className={`my-order-card ${isCancelled ? "cancelled" : ""}`} key={order.id}>
                    <div className="my-order-top">
                      <div>
                        <span className="my-order-label">Order ID</span>
                        <h3>#{order.id}</h3>
                      </div>
                      <div className={`my-order-status ${status.toLowerCase()}`}>
                        {status === "DELIVERED" ? "✓ " : ""}{status}
                      </div>
                    </div>

                    <div className="my-order-info-grid">
                      <div><span>Order Amount</span><strong>₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</strong></div>
                      <div><span>Items</span><strong>{Array.isArray(order.items) ? order.items.length : "-"}</strong></div>
                      <div><span>Order Status</span><strong>{status}</strong></div>
                    </div>

                    {isCancelled ? (
                      <div className="my-order-cancelled-box">
                        <strong>❌ Order Cancelled</strong>
                        {order.cancelReason && <p><b>Reason:</b> {order.cancelReason}</p>}
                      </div>
                    ) : (
                      <div className="my-order-progress">
                        {steps.map((step, index) => (
                          <div className={`my-order-step ${currentIndex >= index ? "done" : ""}`} key={step}>
                            <div className="my-order-step-circle">{currentIndex >= index ? "✓" : index + 1}</div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="my-order-actions">
                      {!isDelivered && !isCancelled && !isReturned && (
                        <button
                          className="my-order-track-btn"
                          onClick={async () => {
                            try {
                              const response = await fetch(`${API}/api/orders/user/${currentUser.id}?t=${Date.now()}`, { cache: "no-store" });
                              const data = await response.json();
                              setTrackingOrder(data.find((item) => Number(item.id) === Number(order.id)) || order);
                            } catch (error) {
                              console.error("Track error:", error);
                              setTrackingOrder(order);
                            }
                            setShowOrders(false);
                          }}
                        >
                          🚚 Track My Order
                        </button>
                      )}

                      {isDelivered && returnWindowOpen && (
                        <button
                          className="my-order-return-btn"
                          disabled={returnLoading === order.id}
                          onClick={() => handleReturnOrder(order.id)}
                        >
                          {returnLoading === order.id ? "Submitting..." : "↩ Return Order"}
                        </button>
                      )}

                      {canCancel && (
                        <button className="my-order-cancel-btn" onClick={() => handleCancelOrder(order.id)}>
                          ❌ Cancel Order
                        </button>
                      )}
                    </div>

                    {isDelivered && !returnWindowOpen && (
                      <div className="return-expired-note">Return period has expired (7 days).</div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  // =====================================================
  // HOME / PRODUCTS PAGE
  // =====================================================

  if (isLoggedIn) {
    return (
      <div className="home-container">

        <Header
          currentUser={currentUser}
          cartCount={cartCount}
          activePage="products"
          onNavigate={navigateTo}
          onLogout={logout}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <main className="products-container">

          <h2>
            Our Products
          </h2>

          <div className="product-grid">

            {filteredProducts.length === 0 ? (

              <p>
                No products available.
              </p>

            ) : (

              filteredProducts.map(
                (product) => (

                  <div
                    className="product-card"
                    key={product.id}
                  >

                    {product.image ? (

                      <img
                        src={getImageUrl(
                          product.image
                        )}
                        alt={product.name}
                        onError={(e) => {

                          console.error(
                            "Product image failed:",
                            product.image,
                            getImageUrl(
                              product.image
                            )
                          );

                          e.currentTarget.style.display =
                            "none";
                        }}
                      />

                    ) : (

                      <div className="no-image">
                        No Image
                      </div>

                    )}

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {product.description}
                    </p>

                    <h4>
                      ₹
                      {Number(
                        product.price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </h4>

                    <p>
                      Available:{" "}
                      {product.quantity}
                    </p>

                    <button
                      onClick={() =>
                        addToCart(product)
                      }
                      disabled={
                        product.quantity <= 0
                      }
                    >
                      {product.quantity <= 0
                        ? "Out of Stock"
                        : "Add to Cart"}
                    </button>

                  </div>

                )
              )

            )}

          </div>

        </main>

        <Footer />

      </div>
    );
  }

  // =====================================================
  // LOGIN / REGISTER PAGE
  // =====================================================

  return (
    <div className="login-container">

      <div className="login-card">

        <h1>
          Sagar E-Shop
        </h1>

        <p className="subtitle">
          {isRegister
            ? "Create your account."
            : "Welcome back! Please login."}
        </p>

        <form onSubmit={handleSubmit}>

          {isRegister && (
            <>
              <label>
                Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </>
          )}

          <label>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button type="submit">
            {isRegister
              ? "Register"
              : "Login"}
          </button>

        </form>

        <p className="register-text">

          {isRegister
            ? "Already have an account? "
            : "Don't have an account? "}

          <span
            onClick={() => {
              setIsRegister(!isRegister);

              setName("");
              setEmail("");
              setPassword("");
            }}
          >
            {isRegister
              ? "Login"
              : "Register"}
          </span>

        </p>

      </div>

      <Footer />

    </div>
  );
}

export default App;