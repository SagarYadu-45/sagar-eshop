
import { useEffect, useMemo, useState } from "react";

const ORDERS_API = "http://localhost:8080/api/orders";
const PRODUCTS_API = "http://localhost:8080/api/products";

function AdminOrders({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});

  const [updatingStatus, setUpdatingStatus] = useState({});
  const [updatingReturn, setUpdatingReturn] = useState({});

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem("token");

    return {
      ...extraHeaders,
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const readJsonResponse = async (response) => {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const getErrorMessage = (response, data, defaultMessage) => {
    if (response.status === 401) {
      return "Your login session has expired. Please login again.";
    }

    if (response.status === 403) {
      return "Access denied. Only an administrator can manage orders.";
    }

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    return defaultMessage;
  };

  const loadOrders = async () => {
    setLoading(true);
    setOrdersError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(`${ORDERS_API}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: getAuthHeaders({
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }),
      });

      const data = await readJsonResponse(response);

      console.log("Admin Orders response:", response.status, data);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(response, data, "Unable to load orders")
        );
      }

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data?.content)) {
        setOrders(data.content);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Admin orders error:", error);
      setOrders([]);
      setOrdersError(error.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${PRODUCTS_API}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: getAuthHeaders({
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(response, data, "Products could not be loaded")
        );
      }

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (Array.isArray(data?.content)) {
        setProducts(data.content);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Products loading error:", error);
      setProducts([]);
    }
  };

  const loadReturnRequests = async () => {
    try {
      const response = await fetch(
        `${ORDERS_API}/returns?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders({
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        console.warn(
          "Return requests failed:",
          response.status,
          data
        );
        setReturnRequests([]);
        return;
      }

      if (Array.isArray(data)) {
        setReturnRequests(data);
      } else if (Array.isArray(data?.content)) {
        setReturnRequests(data.content);
      } else {
        setReturnRequests([]);
      }
    } catch (error) {
      console.error("Return requests error:", error);
      setReturnRequests([]);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      loadOrders(),
      loadProducts(),
      loadReturnRequests(),
    ]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const productMap = useMemo(() => {
    const map = {};

    products.forEach((product) => {
      if (product?.id != null) {
        map[String(product.id)] = product;
      }
    });

    return map;
  }, [products]);

  const getProductName = (productId) => {
    const product = productMap[String(productId)];

    return product?.name || `Product #${productId}`;
  };

  const getCustomerName = (order) => {
    return (
      order?.customerName ||
      order?.customer?.name ||
      order?.user?.name ||
      `User #${order?.userId ?? "Unknown"}`
    );
  };

  const getCustomerPhone = (order) => {
    return (
      order?.phone ||
      order?.customer?.phone ||
      order?.user?.phone ||
      "Not provided"
    );
  };

  const normalizeStatus = (status) => {
    return String(status || "PLACED")
      .trim()
      .toUpperCase();
  };

  const getStatusClass = (status) => {
    return `order-status ${normalizeStatus(status).toLowerCase()}`;
  };

  const formatAmount = (amount) => {
    const value = Number(amount || 0);

    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadOrderItems = async (orderId) => {
    if (!orderId) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(orderItems, orderId)) {
      return;
    }

    setLoadingItems((prev) => ({
      ...prev,
      [orderId]: true,
    }));

    try {
      const response = await fetch(
        `${ORDERS_API}/${orderId}/items?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: getAuthHeaders({
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            response,
            data,
            "Unable to load order items"
          )
        );
      }

      let items = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data?.content)) {
        items = data.content;
      }

      setOrderItems((prev) => ({
        ...prev,
        [orderId]: items,
      }));
    } catch (error) {
      console.error("Order items error:", error);

      setOrderItems((prev) => ({
        ...prev,
        [orderId]: [],
      }));
    } finally {
      setLoadingItems((prev) => ({
        ...prev,
        [orderId]: false,
      }));
    }
  };

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);
    await loadOrderItems(orderId);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const status = normalizeStatus(newStatus);

    if (!orderId || !status) {
      return;
    }

    setUpdatingStatus((prev) => ({
      ...prev,
      [orderId]: true,
    }));

    try {
      const response = await fetch(
        `${ORDERS_API}/${orderId}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            response,
            data,
            "Unable to update order status"
          )
        );
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          Number(order.id) === Number(orderId)
            ? {
                ...order,
                status,
              }
            : order
        )
      );

      alert(
        `Order #${orderId} status updated to ${status}.`
      );

      await loadOrders();
    } catch (error) {
      console.error("Status update error:", error);
      alert(
        error.message || "Unable to update order status."
      );
    } finally {
      setUpdatingStatus((prev) => ({
        ...prev,
        [orderId]: false,
      }));
    }
  };

  const updateReturnStatus = async (returnId, status) => {
    if (!returnId) {
      return;
    }

    const normalizedStatus = normalizeStatus(status);

    setUpdatingReturn((prev) => ({
      ...prev,
      [returnId]: true,
    }));

    try {
      const response = await fetch(
        `${ORDERS_API}/returns/${returnId}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
          body: JSON.stringify({
            status: normalizedStatus,
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            response,
            data,
            "Unable to update return status"
          )
        );
      }

      setReturnRequests((prevRequests) =>
        prevRequests.map((request) =>
          Number(request.id) === Number(returnId)
            ? {
                ...request,
                status: normalizedStatus,
              }
            : request
        )
      );

      alert(
        `Return request #${returnId} status updated to ${normalizedStatus}.`
      );

      await Promise.all([
        loadReturnRequests(),
        loadOrders(),
      ]);
    } catch (error) {
      console.error("Return status update error:", error);

      alert(
        error.message ||
          "Unable to update return status."
      );
    } finally {
      setUpdatingReturn((prev) => ({
        ...prev,
        [returnId]: false,
      }));
    }
  };

  const returnMap = useMemo(() => {
    const map = {};

    returnRequests.forEach((request) => {
      if (request?.orderId != null) {
        map[String(request.orderId)] = request;
      }
    });

    return map;
  }, [returnRequests]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = orders.filter((order) => {
      const status = normalizeStatus(order?.status);

      if (
        statusFilter !== "ALL" &&
        status !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const customerName =
        getCustomerName(order).toLowerCase();

      const phone =
        getCustomerPhone(order).toLowerCase();

      const orderId =
        String(order?.id ?? "").toLowerCase();

      const userId =
        String(order?.userId ?? "").toLowerCase();

      return (
        customerName.includes(query) ||
        phone.includes(query) ||
        orderId.includes(query) ||
        userId.includes(query)
      );
    });

    result.sort((a, b) => {
      const dateA = new Date(
        a?.createdAt ||
          a?.orderDate ||
          a?.createdDate ||
          a?.date ||
          0
      ).getTime();

      const dateB = new Date(
        b?.createdAt ||
          b?.orderDate ||
          b?.createdDate ||
          b?.date ||
          0
      ).getTime();

      if (sortOrder === "OLDEST") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [orders, search, statusFilter, sortOrder]);

  const statistics = useMemo(() => {
    const countByStatus = (status) =>
      orders.filter(
        (order) =>
          normalizeStatus(order?.status) === status
      ).length;

    return {
      total: orders.length,
      placed: countByStatus("PLACED"),
      processing: countByStatus("PROCESSING"),
      shipped: countByStatus("SHIPPED"),
      delivered: countByStatus("DELIVERED"),
      cancelled: countByStatus("CANCELLED"),
      returned: countByStatus("RETURNED"),
    };
  }, [orders]);

  if (
    currentUser &&
    String(currentUser.role || "").toUpperCase() !== "ADMIN"
  ) {
    return (
      <main className="admin-orders-page">
        <section className="admin-orders-empty">
          <div className="empty-order-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>
            Only administrators can view and manage orders.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-orders-page">
      <section className="admin-orders-header">
        <div>
          <h1>📦 Order Management</h1>
          <p>
            View customer orders, order items, delivery details,
            and manage order status.
          </p>
        </div>

        <button
          className="refresh-orders-btn"
          onClick={refreshAll}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </section>

      <section className="admin-order-statistics">
        <div className="admin-order-stat-card">
          <span>Total Orders</span>
          <strong>{statistics.total}</strong>
        </div>

        <div className="admin-order-stat-card">
          <span>Placed</span>
          <strong>{statistics.placed}</strong>
        </div>

        <div className="admin-order-stat-card">
          <span>Processing</span>
          <strong>{statistics.processing}</strong>
        </div>

        <div className="admin-order-stat-card">
          <span>Shipped</span>
          <strong>{statistics.shipped}</strong>
        </div>

        <div className="admin-order-stat-card">
          <span>Delivered</span>
          <strong>{statistics.delivered}</strong>
        </div>

        <div className="admin-order-stat-card">
          <span>Cancelled</span>
          <strong>{statistics.cancelled}</strong>
        </div>

        <div className="admin-order-stat-card">
          <span>Returned</span>
          <strong>{statistics.returned}</strong>
        </div>
      </section>

      <section className="admin-order-filters">
        <div className="admin-order-search">
          <input
            type="text"
            placeholder="Search by customer, phone, order ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-order-filter-control">
          <label>Status</label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">All Orders</option>
            <option value="PLACED">Placed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>

        <div className="admin-order-filter-control">
          <label>Sort</label>

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value)
            }
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </section>

      {ordersError && (
        <section className="admin-orders-error">
          <strong>Unable to load orders</strong>

          <p>{ordersError}</p>

          <button onClick={loadOrders}>
            Try Again
          </button>
        </section>
      )}

      <section className="admin-orders-list-section">
        <div className="admin-orders-list-header">
          <h2>Customer Orders</h2>

          <span>
            Showing {filteredOrders.length} of {orders.length}
          </span>
        </div>

        {loading ? (
          <div className="admin-orders-loading">
            <div className="admin-orders-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-orders-empty">
            <div className="empty-order-icon">📦</div>

            <h3>No orders found</h3>

            <p>
              {search || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "There are no customer orders yet."}
            </p>
          </div>
        ) : (
          <div className="admin-orders-list">
            {filteredOrders.map((order) => {
              const status = normalizeStatus(order?.status);

              const isExpanded =
                Number(expandedOrderId) ===
                Number(order?.id);

              const items =
                orderItems[order?.id] || [];

              const returnRequest =
                returnMap[String(order?.id)];

              const statusLocked =
                status === "CANCELLED" ||
                status === "RETURNED";

              return (
                <div
                  className="admin-order-card"
                  key={order?.id}
                >
                  <div className="admin-order-main">
                    <div className="admin-order-id">
                      <span>Order ID</span>

                      <strong>
                        #{order?.id ?? "N/A"}
                      </strong>
                    </div>

                    <div className="admin-order-customer">
                      <span>Customer</span>

                      <strong>
                        {getCustomerName(order)}
                      </strong>

                      <small>
                        {getCustomerPhone(order)}
                      </small>
                    </div>

                    <div className="admin-order-date">
                      <span>Order Date</span>

                      <strong>
                        {formatDate(
                          order?.createdAt ||
                            order?.orderDate ||
                            order?.createdDate ||
                            order?.date
                        )}
                      </strong>
                    </div>

                    <div className="admin-order-amount">
                      <span>Total</span>

                      <strong>
                        {formatAmount(
                          order?.totalAmount
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>

                      <span className={getStatusClass(status)}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="admin-order-extra">
                    {order?.paymentMethod && (
                      <div>
                        <span>Payment</span>

                        <strong>
                          {order.paymentMethod}
                        </strong>
                      </div>
                    )}

                    {order?.userId != null && (
                      <div>
                        <span>User ID</span>

                        <strong>
                          #{order.userId}
                        </strong>
                      </div>
                    )}

                    {(order?.address ||
                      order?.city ||
                      order?.state ||
                      order?.pincode) && (
                      <div className="admin-order-address">
                        <span>Delivery Address</span>

                        <strong>
                          {order?.address || ""}
                          {order?.city
                            ? `, ${order.city}`
                            : ""}
                          {order?.state
                            ? `, ${order.state}`
                            : ""}
                          {order?.pincode
                            ? ` - ${order.pincode}`
                            : ""}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="order-status-management">
                    <div className="status-control">
                      <label>
                        Update Order Status
                      </label>

                      <select
                        value={status}
                        disabled={
                          Boolean(
                            updatingStatus[order?.id]
                          ) || statusLocked
                        }
                        onChange={(event) =>
                          updateOrderStatus(
                            order?.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="PLACED">
                          PLACED
                        </option>

                        <option value="PROCESSING">
                          PROCESSING
                        </option>

                        <option value="SHIPPED">
                          SHIPPED
                        </option>

                        <option value="DELIVERED">
                          DELIVERED
                        </option>

                        <option value="CANCELLED">
                          CANCELLED
                        </option>

                        <option value="RETURNED">
                          RETURNED
                        </option>
                      </select>
                    </div>

                    <button
                      className="update-status-btn"
                      disabled={
                        Boolean(
                          updatingStatus[order?.id]
                        ) || statusLocked
                      }
                      onClick={() =>
                        updateOrderStatus(
                          order?.id,
                          status
                        )
                      }
                    >
                      {updatingStatus[order?.id]
                        ? "Updating..."
                        : "Update"}
                    </button>
                  </div>

                  {returnRequest && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "14px",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong>
                            ↩️ Return Request
                          </strong>

                          <div
                            style={{
                              marginTop: "5px",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            {returnRequest?.reason ||
                              "No reason provided"}
                          </div>
                        </div>

                        <span
                          className={`order-status ${normalizeStatus(
                            returnRequest?.status
                          ).toLowerCase()}`}
                        >
                          {normalizeStatus(
                            returnRequest?.status
                          )}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "12px",
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <select
                          value={normalizeStatus(
                            returnRequest?.status
                          )}
                          disabled={
                            Boolean(
                              updatingReturn[
                                returnRequest?.id
                              ]
                            ) ||
                            normalizeStatus(
                              returnRequest?.status
                            ) === "APPROVED" ||
                            normalizeStatus(
                              returnRequest?.status
                            ) === "REJECTED"
                          }
                          onChange={(event) =>
                            updateReturnStatus(
                              returnRequest?.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="REQUESTED">
                            REQUESTED
                          </option>

                          <option value="APPROVED">
                            APPROVED
                          </option>

                          <option value="REJECTED">
                            REJECTED
                          </option>

                          <option value="COMPLETED">
                            COMPLETED
                          </option>
                        </select>

                        <button
                          className="update-status-btn"
                          disabled={Boolean(
                            updatingReturn[
                              returnRequest?.id
                            ]
                          )}
                          onClick={() =>
                            updateReturnStatus(
                              returnRequest?.id,
                              normalizeStatus(
                                returnRequest?.status
                              )
                            )
                          }
                        >
                          {updatingReturn[
                            returnRequest?.id
                          ]
                            ? "Updating..."
                            : "Update Return"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="order-action">
                    <button
                      className="view-order-btn"
                      onClick={() =>
                        toggleOrderDetails(order?.id)
                      }
                    >
                      {isExpanded
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="order-details">
                      <h4>Order Items</h4>

                      {loadingItems[order?.id] && (
                        <p className="no-order-items">
                          Loading order items...
                        </p>
                      )}

                      {!loadingItems[order?.id] &&
                        items.length === 0 && (
                          <p className="no-order-items">
                            No order items found.
                          </p>
                        )}

                      {!loadingItems[order?.id] &&
                        items.length > 0 && (
                          <div className="order-items-list">
                            {items.map((item) => {
                              const product =
                                productMap[
                                  String(
                                    item?.productId
                                  )
                                ];

                              const quantity =
                                Number(
                                  item?.quantity || 0
                                );

                              const price =
                                Number(
                                  item?.price ??
                                    product?.price ??
                                    0
                                );

                              const subtotal =
                                price * quantity;

                              return (
                                <div
                                  className="admin-order-item"
                                  key={
                                    item?.id ??
                                    `${order?.id}-${item?.productId}`
                                  }
                                >
                                  <div className="order-item-info">
                                    <strong>
                                      {getProductName(
                                        item?.productId
                                      )}
                                    </strong>

                                    <span>
                                      Product ID: #
                                      {item?.productId ??
                                        "N/A"}
                                    </span>
                                  </div>

                                  <div>
                                    <span>
                                      Quantity
                                    </span>

                                    <strong>
                                      {quantity}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Price
                                    </span>

                                    <strong>
                                      {formatAmount(
                                        price
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Subtotal
                                    </span>

                                    <strong>
                                      {formatAmount(
                                        subtotal
                                      )}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminOrders;

