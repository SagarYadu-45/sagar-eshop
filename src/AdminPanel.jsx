import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/api/products";

function AdminPanel() {
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem("token");

    return {
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    const value = String(image).trim();

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (value.startsWith("/uploads/")) {
      return `http://localhost:8080${value}`;
    }

    return `http://localhost:8080/uploads/${encodeURIComponent(value)}`;
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Products fetch failed");
      }

      const data = await response.json();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Products error:", error);
      alert("Products load nahi ho rahe.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);

    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile]);

  const clearForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setQuantity("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);

    const fileInput = document.getElementById("productImage");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Product name enter karo.");
      return;
    }

    if (price === "" || Number(price) < 0) {
      alert("Valid price enter karo.");
      return;
    }

    if (quantity === "" || Number(quantity) < 0) {
      alert("Valid quantity enter karo.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Your login session has expired. Please login again.");
      return;
    }

    const productData = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      quantity: Number(quantity),
    };

    const formData = new FormData();

    formData.append(
      "product",
      new Blob([JSON.stringify(productData)], {
        type: "application/json",
      })
    );

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      setLoading(true);

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: formData,
      });

      const errorText = await response.text();

      if (!response.ok) {
        console.error("Server error:", errorText);

        if (response.status === 401 || response.status === 403) {
          alert("You are not authorized. Please login again.");
          return;
        }

        throw new Error(errorText || "Product save failed");
      }

      alert(
        editingId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      clearForm();

      await fetchProducts();
    } catch (error) {
      console.error("Product save error:", error);
      alert("Product save nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setName(product.name || "");
    setPrice(product.price ?? "");
    setDescription(product.description || "");
    setQuantity(product.quantity ?? "");

    setImageFile(null);
    setImagePreview(null);

    const fileInput = document.getElementById("productImage");

    if (fileInput) {
      fileInput.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap ye product delete karna chahte ho?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Your login session has expired. Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const errorText = await response.text();

      if (!response.ok) {
        console.error("Delete server error:", errorText);

        if (response.status === 401 || response.status === 403) {
          alert("You are not authorized. Please login again.");
          return;
        }

        throw new Error(errorText || "Delete failed");
      }

      alert("Product deleted successfully!");

      await fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Product delete nahi ho paya.");
    }
  };

  const handleQuickRestock = async (product) => {
    const input = window.prompt(
      `"${product.name}" ke liye naya stock quantity daalo:`,
      product.quantity ?? 0
    );

    if (input === null) {
      return;
    }

    const newQuantity = Number(input);

    if (Number.isNaN(newQuantity) || newQuantity < 0) {
      alert("Please ek valid quantity daalo.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Your login session has expired. Please login again.");
      return;
    }

    const productData = {
      name: product.name,
      price: Number(product.price),
      description: product.description || "",
      quantity: newQuantity,
    };

    const formData = new FormData();

    formData.append(
      "product",
      new Blob([JSON.stringify(productData)], {
        type: "application/json",
      })
    );

    try {
      const response = await fetch(`${API_URL}/${product.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      const errorText = await response.text();

      if (!response.ok) {
        console.error("Restock server error:", errorText);

        if (response.status === 401 || response.status === 403) {
          alert("You are not authorized. Please login again.");
          return;
        }

        throw new Error(errorText || "Restock failed");
      }

      alert("Stock updated successfully!");

      await fetchProducts();
    } catch (error) {
      console.error("Restock error:", error);
      alert("Stock update nahi ho paya.");
    }
  };

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.quantity || 0),
    0
  );

  const outOfStock = products.filter(
    (product) =>
      Number(product.quantity) === 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.quantity) > 0 &&
      Number(product.quantity) <= 5
  ).length;

  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.price || 0) *
        Number(product.quantity || 0),
    0
  );

  const visibleProducts = useMemo(() => {
    const searchText =
      productSearch.trim().toLowerCase();

    let list = products.filter((product) => {
      if (!searchText) {
        return true;
      }

      return (
        product.name
          ?.toLowerCase()
          .includes(searchText) ||
        product.description
          ?.toLowerCase()
          .includes(searchText)
      );
    });

    list = [...list];

    switch (sortBy) {
      case "name-asc":
        list.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;

      case "price-low":
        list.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );
        break;

      case "price-high":
        list.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );
        break;

      case "stock-low":
        list.sort(
          (a, b) =>
            Number(a.quantity || 0) -
            Number(b.quantity || 0)
        );
        break;

      case "stock-high":
        list.sort(
          (a, b) =>
            Number(b.quantity || 0) -
            Number(a.quantity || 0)
        );
        break;

      default:
        break;
    }

    return list;
  }, [products, productSearch, sortBy]);

  return (
    <main className="admin-container">

      <section className="admin-header">
        <div>
          <h2>⚙️ Admin Panel</h2>
          <p>
            Manage your products and inventory
          </p>
        </div>
      </section>

      {/* =========================
          STATISTICS
      ========================= */}

      <section className="admin-stats">

        <div className="admin-stat-card">
          <span>Total Products</span>
          <strong>{totalProducts}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Total Stock</span>
          <strong>{totalStock}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Low Stock</span>
          <strong>{lowStock}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Out of Stock</span>
          <strong>{outOfStock}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Inventory Value</span>
          <strong>
            ₹{inventoryValue.toLocaleString("en-IN")}
          </strong>
        </div>

      </section>

      {/* =========================
          PRODUCT FORM
      ========================= */}

      <section className="admin-form-section">

        <div className="section-title">

          <div>
            <h3>
              {editingId
                ? "✏️ Update Product"
                : "➕ Add New Product"}
            </h3>

            <p>
              {editingId
                ? "Update product information"
                : "Add a new product to your store"}
            </p>
          </div>

        </div>

        <form
          className="admin-product-form"
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            <div className="form-group">
              <label>Product Name</label>

              <input
                type="text"
                placeholder="Enter product name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Price</label>

              <input
                type="number"
                min="0"
                placeholder="Enter price"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>

              <input
                type="number"
                min="0"
                placeholder="Enter stock quantity"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value)
                }
                disabled={loading}
              />
            </div>

          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              placeholder="Enter product description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">

            <label>Product Image</label>

            <div className="file-input-wrapper">

              <input
                id="productImage"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImageFile(
                    e.target.files?.[0] || null
                  )
                }
                disabled={loading}
              />

              <span>
                {imageFile
                  ? imageFile.name
                  : "Choose product image"}
              </span>

            </div>

            {imagePreview && (
              <div
                style={{
                  marginTop: "10px",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border:
                      "1px solid #e5e7eb",
                  }}
                />
              </div>
            )}

          </div>

          <div className="admin-form-buttons">

            <button
              type="submit"
              className="save-product-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "✏️ Update Product"
                : "➕ Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-product-btn"
                onClick={clearForm}
                disabled={loading}
              >
                Cancel
              </button>
            )}

          </div>

        </form>

      </section>

      {/* =========================
          PRODUCTS
      ========================= */}

      <section className="admin-products-section">

        <div className="section-title">

          <div>
            <h3>📦 Products</h3>

            <p>
              Manage all products in your store
            </p>
          </div>

          <span className="product-count">
            {visibleProducts.length} /{" "}
            {totalProducts} Products
          </span>

        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            margin: "0 0 20px",
          }}
        >

          <input
            type="text"
            placeholder="Search products by name or description..."
            value={productSearch}
            onChange={(e) =>
              setProductSearch(e.target.value)
            }
            style={{
              flex: "1 1 250px",
              padding: "10px 14px",
              borderRadius: "8px",
              border:
                "1px solid #d1d5db",
            }}
          />

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
            }
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border:
                "1px solid #d1d5db",
            }}
          >
            <option value="default">
              Sort: Default
            </option>

            <option value="name-asc">
              Name (A-Z)
            </option>

            <option value="price-low">
              Price: Low to High
            </option>

            <option value="price-high">
              Price: High to Low
            </option>

            <option value="stock-low">
              Stock: Low to High
            </option>

            <option value="stock-high">
              Stock: High to Low
            </option>
          </select>

        </div>

        {products.length === 0 ? (

          <div className="empty-products">

            <div>📦</div>

            <h3>
              No Products Found
            </h3>

            <p>
              Add your first product using
              the form above.
            </p>

          </div>

        ) : visibleProducts.length === 0 ? (

          <div className="empty-products">

            <div>🔍</div>

            <h3>
              No products match your search
            </h3>

            <p>
              Try a different search term.
            </p>

          </div>

        ) : (

          <div className="admin-product-grid">

            {visibleProducts.map(
              (product) => (

                <div
                  className="admin-product-card"
                  key={product.id}
                >

                  <div className="admin-product-image">

                    {product.image ? (

                      <img
                        src={getImageUrl(
                          product.image
                        )}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />

                    ) : (

                      <div className="no-image">
                        📷
                        <span>
                          No Image
                        </span>
                      </div>

                    )}

                  </div>

                  <div className="admin-product-info">

                    <div className="product-name-row">

                      <h4>
                        {product.name}
                      </h4>

                      {Number(
                        product.quantity
                      ) === 0 ? (

                        <span className="stock-badge out">
                          Out of Stock
                        </span>

                      ) : Number(
                          product.quantity
                        ) <= 5 ? (

                        <span className="stock-badge low">
                          Low Stock
                        </span>

                      ) : (

                        <span className="stock-badge available">
                          Available
                        </span>

                      )}

                    </div>

                    <p className="admin-description">
                      {product.description}
                    </p>

                    <div className="product-details">

                      <div>
                        <span>
                          Price
                        </span>

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Stock
                        </span>

                        <strong>
                          {product.quantity}
                        </strong>
                      </div>

                    </div>

                    <div className="admin-card-buttons">

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(
                            product
                          )
                        }
                        disabled={loading}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(
                            product.id
                          )
                        }
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>

                    </div>

                    {Number(
                      product.quantity
                    ) <= 5 && (

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickRestock(
                            product
                          )
                        }
                        disabled={loading}
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          background:
                            "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px",
                          cursor: loading
                            ? "not-allowed"
                            : "pointer",
                          fontWeight: "600",
                          opacity: loading
                            ? 0.7
                            : 1,
                        }}
                      >
                        🔄 Quick Restock
                      </button>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

    </main>
  );
}

export default AdminPanel;