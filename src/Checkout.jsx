import { useState } from "react";

function Checkout({
  currentUser,
  cart,
  cartTotal,
  cartCount,
  getImageUrl,
  onBackToCart,
  onPlaceOrder,
  loading = false,
}) {
  const [fullName, setFullName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!phone.trim() || !/^[0-9]{10}$/.test(phone.trim())) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    if (!city.trim()) {
      alert("Please enter your city.");
      return;
    }

    if (!state.trim()) {
      alert("Please enter your state.");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    onPlaceOrder({
      customerName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      paymentMethod,
    });
  };

  return (
    <main className="checkout-container">
      <div className="checkout-header">
        <div>
          <h2>🛒 Checkout</h2>
          <p>Complete your delivery and payment details.</p>
        </div>

        <button
          type="button"
          className="checkout-back-button"
          onClick={onBackToCart}
          disabled={loading}
        >
          ← Back to Cart
        </button>
      </div>

      <div className="checkout-layout">
        <section className="checkout-form-card">
          <h3>📍 Delivery Information</h3>

          <form onSubmit={handleSubmit}>
            <div className="checkout-form-grid">
              <div className="checkout-field">
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="checkout-field">
                <label>Mobile Number</label>

                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  maxLength={10}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, ""))
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="checkout-field">
              <label>Delivery Address</label>

              <textarea
                placeholder="House no., street, area, landmark..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="checkout-form-grid">
              <div className="checkout-field">
                <label>City</label>

                <input
                  type="text"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="checkout-field">
                <label>State</label>

                <input
                  type="text"
                  placeholder="Enter state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="checkout-form-grid">
              <div className="checkout-field">
                <label>PIN Code</label>

                <input
                  type="text"
                  placeholder="6-digit PIN code"
                  value={pincode}
                  maxLength={6}
                  onChange={(e) =>
                    setPincode(e.target.value.replace(/\D/g, ""))
                  }
                  disabled={loading}
                />
              </div>

              <div className="checkout-field">
                <label>Payment Method</label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="COD">
                    Cash on Delivery
                  </option>

                  <option value="ONLINE">
                    Online Payment
                  </option>
                </select>
              </div>
            </div>

            <div className="payment-info-box">
              {paymentMethod === "COD" ? (
                <>
                  <strong>💵 Cash on Delivery</strong>

                  <p>
                    Pay when your order is delivered to your
                    address.
                  </p>
                </>
              ) : (
                <>
                  <strong>💳 Online Payment</strong>

                  <p>
                    Online payment will be available through
                    the secure payment gateway.
                  </p>
                </>
              )}
            </div>

            <button
              type="submit"
              className="place-order-final-button"
              disabled={loading || cart.length === 0}
            >
              {loading
                ? "Placing Order..."
                : `Place Order • ₹${Number(cartTotal).toLocaleString(
                    "en-IN"
                  )}`}
            </button>
          </form>
        </section>

        <section className="checkout-summary-card">
          <h3>📦 Order Summary</h3>

          <div className="checkout-items">
            {cart.map((item) => (
              <div
                className="checkout-item"
                key={item.id}
              >
                <div className="checkout-item-image">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="checkout-no-image">
                      No Image
                    </div>
                  )}
                </div>

                <div className="checkout-item-details">
                  <h4>{item.name}</h4>

                  <p>
                    Quantity:{" "}
                    <strong>{item.cartQuantity}</strong>
                  </p>

                  <span>
                    ₹
                    {Number(item.price).toLocaleString(
                      "en-IN"
                    )}{" "}
                    × {item.cartQuantity}
                  </span>
                </div>

                <strong className="checkout-item-total">
                  ₹
                  {(
                    Number(item.price) *
                    Number(item.cartQuantity)
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            ))}
          </div>

          <div className="checkout-summary-divider"></div>

          <div className="checkout-summary-row">
            <span>Total Items</span>
            <strong>{cartCount}</strong>
          </div>

          <div className="checkout-summary-row">
            <span>Subtotal</span>

            <strong>
              ₹{Number(cartTotal).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="checkout-summary-row">
            <span>Delivery</span>

            <strong className="free-delivery">
              FREE
            </strong>
          </div>

          <div className="checkout-summary-divider"></div>

          <div className="checkout-total-row">
            <span>Total Amount</span>

            <strong>
              ₹{Number(cartTotal).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="secure-checkout-box">
            🔒 <span>Secure Checkout</span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Checkout;