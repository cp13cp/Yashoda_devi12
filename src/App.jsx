import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "include", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body;
}

let razorpayScriptPromise;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      razorpayScriptPromise = null;
      reject(new Error("Secure payment checkout could not be loaded. Please try again."));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

function Icon({ name }) {
  if (name === "bag") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  }
  if (name === "search") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></svg>;
}

function ProductImage({ product, className = "" }) {
  return product.imageUrl
    ? <img className={className} src={product.imageUrl} alt={product.name} loading="lazy" />
    : <div className={`${className} image-placeholder`} role="img" aria-label={`${product.name}, no photo yet`}><span>R</span></div>;
}

function WhatsAppFloat() {
  const message = encodeURIComponent("Namaste Rajendra Puja Store, I have a question about puja essentials.");
  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/919770857704?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Rajendra Puja Store on WhatsApp"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 11.6a8.3 8.3 0 0 1-12.3 7.3L4 20l1.2-3.5A8.3 8.3 0 1 1 20 11.6Z" />
        <path d="M9 8.7c.5 2.8 2.4 4.7 5.2 5.3l1-1 2 .9-.3 1.4c-.1.4-.5.7-.9.7-4.9-.5-8.5-4.2-8.9-8.9 0-.4.3-.8.7-.9l1.4-.3.9 2-1.1.8Z" />
      </svg>
      <span>Puja Help</span>
    </a>
  );
}

function ProductCard({ product, onAdd, onView }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <button className="product-image-details" type="button" onClick={() => onView(product)} aria-label={`View details for ${product.name}`}>
          <ProductImage product={product} className="product-image" />
        </button>
        <span className="product-tag">{product.category}</span>
        <button className="quick-add" type="button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to bag`}>+</button>
      </div>
      <div className="product-info">
        <div className="product-name-price"><h3><button className="product-title-link" type="button" onClick={() => onView(product)}>{product.name}</button></h3><span className="product-price">{formatPrice(product.price)}</span></div>
        <button className="product-details-link" type="button" onClick={() => onView(product)}>View product details <span aria-hidden="true">→</span></button>
      </div>
    </article>
  );
}

function ProductDetailsDialog({ product, onClose, onAdd }) {
  return (
    <div className="modal-backdrop product-details-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="product-details-dialog" role="dialog" aria-modal="true" aria-labelledby="product-details-title">
        <button className="product-details-close" type="button" onClick={onClose}><span aria-hidden="true">←</span> Back to collection</button>
        <button className="close-button product-details-x" type="button" onClick={onClose} aria-label="Close product details">×</button>
        <div className="product-details-layout">
          <div className="product-details-image"><ProductImage product={product} className="product-details-photo" /><span className="product-tag">{product.category}</span></div>
          <div className="product-details-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> PUJA ESSENTIALS</span>
            <h2 id="product-details-title">{product.name}</h2>
            <strong className="product-details-price">{formatPrice(product.price)}</strong>
            <div className="product-details-divider" />
            <h3>About this product</h3>
            <p>{product.description || "A carefully selected puja essential for your daily prayers and special occasions."}</p>
            <div className="product-details-note"><span aria-hidden="true">✳</span><span>Chosen with care for your worship and celebrations.</span></div>
            <button className="button button-dark product-details-add" type="button" onClick={() => { onAdd(product); onClose(); }}>Add to basket <span aria-hidden="true">↗</span></button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminDialog({ onClose, onProductsChange, onCategoriesChange }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", category: "", description: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editingProductId, setEditingProductId] = useState(null);
  const [image, setImage] = useState(null);
  const [categoryImage, setCategoryImage] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adminTab, setAdminTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);

  const refreshProducts = useCallback(async () => {
    const items = await api("/api/products");
    setProducts(items);
    onProductsChange(items);
  }, [onProductsChange]);

  const refreshCategories = useCallback(async () => {
    const items = await api("/api/categories");
    setCategories(items);
    onCategoriesChange(items);
  }, [onCategoriesChange]);

  useEffect(() => {
    let active = true;
    api("/api/admin/session")
      .then((result) => {
        if (active && result.authenticated) setAuthenticated(true);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    refreshProducts().catch((requestError) => setError(requestError.message));
    refreshCategories().catch((requestError) => setError(requestError.message));
    api("/api/admin/dashboard")
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message));
  }, [authenticated, refreshCategories, refreshProducts]);

  async function handleLogin(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      setPassword("");
      setAuthenticated(true);
      setNotice("You are signed in. Your products are stored in MongoDB.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    const productForm = event.currentTarget;
    const isEditing = Boolean(editingProductId);
    setPending(true);
    setError("");
    setNotice("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (image) data.append("image", image);
      await api(isEditing ? `/api/products/${encodeURIComponent(editingProductId)}` : "/api/products", {
        method: isEditing ? "PUT" : "POST",
        body: data,
      });
      setForm({ name: "", price: "", category: "", description: "" });
      setImage(null);
      setEditingProductId(null);
      productForm.reset();
      await refreshProducts();
      setNotice(isEditing ? "Product updated." : "Product added to your MongoDB collection.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function handleSaveCategory(event) {
    event.preventDefault();
    const categoryFormElement = event.currentTarget;
    if (!categoryImage) {
      setError("Choose a category image to upload.");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");
    try {
      const data = new FormData();
      data.append("name", categoryForm.name);
      data.append("image", categoryImage);
      await api("/api/categories", { method: "PUT", body: data });
      setCategoryForm({ name: "" });
      setCategoryImage(null);
      categoryFormElement.reset();
      await refreshCategories();
      setNotice("Category image saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  function handleEdit(product) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      description: product.description || "",
    });
    setImage(null);
    setError("");
    setNotice("");
  }

  function cancelEdit() {
    setEditingProductId(null);
    setForm({ name: "", price: "", category: "", description: "" });
    setImage(null);
    setError("");
  }

  async function handleDelete(product) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
      if (editingProductId === product.id) cancelEdit();
      await refreshProducts();
      setNotice(`${product.name} removed.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    setError("");
    try {
      await api("/api/admin/logout", { method: "POST" });
      setAuthenticated(false);
      setProducts([]);
      setPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function updateOrderStatus(orderId, status) {
    setError("");
    setNotice("");
    try {
      const order = await api(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setDashboard((current) => current ? {
        ...current,
        orders: current.orders.map((item) => item._id === orderId ? order : item),
      } : current);
      if (order.emailSent === true) {
        setError("");
        setNotice("Order status updated and customer notified by email.");
      } else if (order.emailSent === false) {
        setNotice("");
        setError("Order status updated, but the customer email could not be sent.");
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updatePaymentStatus(orderId, paymentStatus) {
    setError("");
    setNotice("");
    try {
      const order = await api(`/api/admin/orders/${orderId}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      setDashboard((current) => current ? {
        ...current,
        orders: current.orders.map((item) => item._id === orderId ? order : item),
      } : current);
      if (order.emailSent === true) {
        setError("");
        setNotice("Payment status updated and customer notified by email.");
      } else if (order.emailSent === false) {
        setNotice("");
        setError("Payment status updated, but the customer email could not be sent.");
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title">
        <div className="admin-header">
          <div><span className="eyebrow"><span className="eyebrow-line" /> STORE MANAGER</span><h2 id="admin-title">{authenticated ? "Manage your collection" : "Admin sign in"}</h2></div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {checkingSession ? <p className="admin-loading">Checking your session…</p> : !authenticated ? (
          <form className="product-form login-form" onSubmit={handleLogin}>
            <p className="admin-notice">Sign in to add and manage products in your store.</p>
            <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={80} /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={200} /></label>
            {error && <p className="form-message" role="alert">{error}</p>}
            <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"} <span aria-hidden="true">↗</span></button>
          </form>
        ) : (
          <>
            <div className="admin-toolbar"><p>Products and category photos are saved in MongoDB.</p><button className="text-link" type="button" onClick={handleLogout} disabled={pending}>Sign out</button></div>
            <div className="admin-tabs" role="tablist">
              <button type="button" className={adminTab === "dashboard" ? "active" : ""} onClick={() => setAdminTab("dashboard")}>Dashboard</button>
              <button type="button" className={adminTab === "products" ? "active" : ""} onClick={() => setAdminTab("products")}>Products</button>
              <button type="button" className={adminTab === "categories" ? "active" : ""} onClick={() => setAdminTab("categories")}>Categories</button>
              <button type="button" className={adminTab === "orders" ? "active" : ""} onClick={() => setAdminTab("orders")}>Orders</button>
            </div>
            {adminTab === "dashboard" && (
              <div className="admin-dashboard">
                <div className="dashboard-intro"><div><span className="eyebrow"><span className="eyebrow-line" /> YOUR STORE AT A GLANCE</span><h3>Store overview</h3></div><span>Live performance</span></div>
                <div className="stat-grid">
                  <article className="stat-products"><span className="stat-icon">✳</span><span className="stat-label">Products</span><strong>{dashboard?.stats.productCount ?? products.length}</strong><small>In your collection</small></article>
                  <article className="stat-customers"><span className="stat-icon">♡</span><span className="stat-label">Customers</span><strong>{dashboard?.stats.userCount ?? 0}</strong><small>Verified accounts</small></article>
                  <article className="stat-orders"><span className="stat-icon">↗</span><span className="stat-label">Orders</span><strong>{dashboard?.stats.orderCount ?? 0}</strong><small>All-time orders</small></article>
                  <article className="stat-revenue"><span className="stat-icon">₹</span><span className="stat-label">Revenue</span><strong>{formatPrice(dashboard?.stats.revenue ?? 0)}</strong><small>Excluding cancelled orders</small></article>
                </div>
                <div className="recent-orders-heading"><div><h3>Recent orders</h3><span>Latest customer activity</span></div><button type="button" onClick={() => setAdminTab("orders")}>View all <span aria-hidden="true">→</span></button></div>
                {dashboard?.orders?.length ? dashboard.orders.slice(0, 5).map((order) => (
                  <div className="admin-order-row" key={order._id}>
                    <div><strong>#{order._id.slice(-6).toUpperCase()}</strong><span>{order.user?.name || order.customerName}</span></div>
                    <span>{order.items.length} items</span><strong>{formatPrice(order.subtotal)}</strong><span className={`order-status status-${order.status}`}>{order.status === "new" ? "Pending" : order.status}</span>
                  </div>
                )) : <p className="admin-empty">No orders placed yet.</p>}
              </div>
            )}
            {adminTab === "products" && (
              <>
                <form className="product-form" onSubmit={handleSaveProduct}>
                  <h3>{editingProductId ? "Edit product" : "Add a product"}</h3>
                  <div className="form-row">
                    <label>Product name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={80} placeholder="e.g. Handwoven table runner" /></label>
                    <label>Price (₹)<input type="number" min="1" max="10000000" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required placeholder="499" /></label>
                  </div>
                  <div className="form-row">
                    <label>Category<input list="admin-category-options" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required maxLength={40} placeholder="Puja samagri" /><datalist id="admin-category-options">{categories.map((item) => <option key={item.name} value={item.name} />)}</datalist></label>
                    <label>Photo (JPG, PNG, WebP · up to 3 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />{editingProductId && <small>Leave blank to keep the current photo.</small>}</label>
                  </div>
                  <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={400} rows="2" placeholder="A short note about what makes it special" /></label>
                  {error && <p className="form-message" role="alert">{error}</p>}
                  {notice && <p className="form-message success" role="status">{notice}</p>}
                  <div className="product-form-actions">
                    <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Saving…" : editingProductId ? "Save changes" : "Add to collection"} <span aria-hidden="true">↗</span></button>
                    {editingProductId && <button className="button button-light" type="button" onClick={cancelEdit} disabled={pending}>Cancel</button>}
                  </div>
                </form>
                <div className="admin-products-heading"><h3>In your collection</h3><span>{products.length} {products.length === 1 ? "product" : "products"}</span></div>
                <div className="admin-products">
                  {products.length ? products.map((product) => (
                    <div className="admin-product-row" key={product.id}>
                      <ProductImage product={product} className="admin-thumb" />
                      <div><strong>{product.name}</strong><span>{product.category} · {formatPrice(product.price)}</span></div>
                      <div className="admin-product-actions">
                        <button className="edit-product" type="button" disabled={pending} onClick={() => handleEdit(product)}>Edit</button>
                        <button className="delete-product" type="button" disabled={pending} onClick={() => handleDelete(product)}>Remove</button>
                      </div>
                    </div>
                  )) : <p className="admin-empty">Your collection is empty. Add your first product above.</p>}
                </div>
              </>
            )}
            {adminTab === "categories" && (
              <>
                <form className="product-form" onSubmit={handleSaveCategory}>
                  <h3>Add or update a category</h3>
                  <p className="category-form-note">Upload a square photo to show this category in a circle on the shop page. Use the same name to replace its image.</p>
                  <label>Category name<input list="admin-category-options" value={categoryForm.name} onChange={(event) => setCategoryForm({ name: event.target.value })} required maxLength={40} placeholder="Puja samagri" /><datalist id="admin-category-options">{categories.map((item) => <option key={item.name} value={item.name} />)}</datalist></label>
                  <label>Category photo (JPG, PNG, WebP · up to 3 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCategoryImage(event.target.files?.[0] || null)} required /></label>
                  {error && <p className="form-message" role="alert">{error}</p>}
                  {notice && <p className="form-message success" role="status">{notice}</p>}
                  <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Saving…" : "Save category image"} <span aria-hidden="true">↗</span></button>
                </form>
                <div className="admin-products-heading"><h3>Shop categories</h3><span>{categories.length} {categories.length === 1 ? "category" : "categories"}</span></div>
                <div className="admin-products">
                  {categories.length ? categories.map((item) => (
                    <div className="admin-product-row admin-category-row" key={item.name}>
                      {item.imageUrl ? <img className="admin-thumb admin-category-thumb" src={item.imageUrl} alt="" /> : <span className="admin-category-placeholder">✳</span>}
                      <div><strong>{item.name}</strong><span>{item.imageUrl ? "Image uploaded" : "No image yet"}</span></div>
                    </div>
                  )) : <p className="admin-empty">Add an image for a category. Categories used by products appear here automatically.</p>}
                </div>
              </>
            )}
            {adminTab === "orders" && (
              <>
                {error && <p className="form-message" role="alert">{error}</p>}
                {notice && <p className="form-message success" role="status">{notice}</p>}
                <div className="admin-orders">
                  {dashboard?.orders?.length ? dashboard.orders.map((order) => (
                  <article className="admin-order-card" key={order._id}>
                    <div className="admin-order-head"><div><strong>#{order._id.slice(-6).toUpperCase()}</strong><span>{order.user?.name || order.customerName} · {order.user?.email || ""}</span></div><strong>{formatPrice(order.subtotal)}</strong></div>
                    <div className="admin-order-items">{order.items.map((item, index) => <span key={index}>{item.name} × {item.quantity}</span>)}</div>
                    <div className="admin-cod-meta"><strong>{order.paymentMethod === "razorpay" ? "Razorpay" : order.paymentMethod === "upi" ? "UPI" : "COD"}</strong><span>{order.customerPhone}</span><small>{order.deliveryAddress}</small>{order.utr && <small>UTR: {order.utr}</small>}</div>
                    <select value={order.status} onChange={(event) => updateOrderStatus(order._id, event.target.value)} aria-label={`Status for order ${order._id.slice(-6)}`}>
                      <option value="new">Pending</option><option value="confirmed">Confirmed</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
                    </select>
                    {order.paymentMethod === "upi" && (
                      <select value={order.paymentStatus || "pending"} onChange={(event) => updatePaymentStatus(order._id, event.target.value)} aria-label={`Payment status for order ${order._id.slice(-6)}`}>
                        <option value="pending">Payment pending</option><option value="submitted">Payment submitted</option><option value="verified">Payment verified</option><option value="failed">Payment failed</option>
                      </select>
                    )}
                  </article>
                  )) : <p className="admin-empty">No orders placed yet.</p>}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CartDrawer({ items, onClose, onChange, onPlaceOrder, onRequireAuth, isAuthenticated, isProcessing }) {
  const entries = [...items.entries()];
  const subtotal = entries.reduce((sum, [id, item]) => sum + item.product.price * item.quantity, 0);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [showPublicPurchase, setShowPublicPurchase] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  return (
    <div className="modal-backdrop cart-backdrop" onMouseDown={(event) => { if (!isProcessing && event.target === event.currentTarget) onClose(); }}>
      <aside className="drawer cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-header"><div><span className="eyebrow">PUJA ESSENTIALS</span><h2 id="cart-title">Your basket <span>({entries.reduce((sum, [, item]) => sum + item.quantity, 0)})</span></h2></div><button className="close-button" type="button" onClick={onClose} disabled={isProcessing} aria-label="Close basket">×</button></div>
        {entries.length ? <div className="cart-items">{entries.map(([id, item]) => (
          <div className="cart-row" key={id}>
            <ProductImage product={item.product} className="cart-thumb" />
            <div className="cart-row-info"><h3>{item.product.name}</h3><span>{formatPrice(item.product.price)} each</span><div className="quantity-control">
              <button type="button" onClick={() => onChange(id, -1)} aria-label={`Remove one ${item.product.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => onChange(id, 1)} aria-label={`Add one ${item.product.name}`}>+</button>
            </div></div>
            <span className="cart-line-total">{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        ))}</div> : <div className="cart-empty"><span>♡</span><p>Your puja basket is waiting for something special.</p><button className="text-link" type="button" onClick={onClose}>Browse puja essentials ↗</button></div>}
        {entries.length > 0 && <div className="cart-footer">
          <div className="cart-subtotal"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="checkout-details">
            <label>Delivery phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" maxLength={20} /></label>
            <label>Delivery address<textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House / Flat, Area, City, PIN code" rows="2" maxLength={500} /></label>
            <label className="recent-purchase-consent">
              <input type="checkbox" checked={showPublicPurchase} onChange={(event) => setShowPublicPurchase(event.target.checked)} />
              <span>I agree to display my full name and city publicly in a recent-purchase popup for up to 15 minutes.</span>
            </label>
            {showPublicPurchase && <label>City shown in popup<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Your city" maxLength={80} /></label>}
            <div className="cod-option"><span aria-hidden="true">✓</span><div><strong>Secure online payment</strong><small>Pay with Razorpay. Your order is created after payment is verified.</small></div></div>
          </div>
          {checkoutError && <p className="form-message" role="alert">{checkoutError}</p>}
          <button className="button button-dark checkout-button" disabled={isProcessing} onClick={() => {
            if (!isAuthenticated) {
              onPlaceOrder ? onPlaceOrder(null) : null;
              return;
            }
            if (!/^[0-9+\-\s]{8,20}$/.test(phone.trim())) { setCheckoutError("Enter a valid delivery phone number."); return; }
            if (address.trim().length < 10) { setCheckoutError("Enter a complete delivery address."); return; }
            if (showPublicPurchase && !city.trim()) { setCheckoutError("Enter your city to opt in to the public purchase popup."); return; }
            setCheckoutError("");
            onPlaceOrder?.({ phone: phone.trim(), address: address.trim(), city: showPublicPurchase ? city.trim() : "", showPublicPurchase })?.catch((requestError) => setCheckoutError(requestError.message));
          }}><span>◉</span> {isProcessing ? "Opening secure checkout…" : isAuthenticated ? `Pay ${formatPrice(subtotal)} & place order` : "Sign in to place order"} <span aria-hidden="true">↗</span></button>
          <span className="secure-note">Your order is placed only after Razorpay confirms payment.</span>
        </div>}
      </aside>
    </div>
  );
}

function AuthDialog({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const result = await api("/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
        setNotice("Verification OTP sent to your email.");
        setMode("verify");
        setForm((current) => ({ ...current, email: result.email }));
      } else if (mode === "verify") {
        const result = await api("/api/user/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, otp: form.otp }),
        });
        onAuthenticated(result.user);
      } else if (mode === "forgot") {
        await api("/api/user/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        setNotice("If the email is registered, a reset OTP has been sent.");
        setMode("reset");
      } else if (mode === "reset") {
        const result = await api("/api/user/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, otp: form.otp, password: form.password }),
        });
        onAuthenticated(result.user);
      } else {
        const result = await api("/api/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        onAuthenticated(result.user);
      }
    } catch (requestError) {
      if (requestError.message.includes("Verify")) setMode("verify");
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  const title = {
    login: "Welcome back",
    signup: "Create your account",
    verify: "Verify your email",
    forgot: "Forgot password",
    reset: "Set a new password",
  }[mode];

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="auth-header">
          <div><span className="eyebrow"><span className="eyebrow-line" /> YOUR YASHODA ACCOUNT</span><h2 id="auth-title">{title}</h2></div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={80} placeholder="Your name" /></label>}
          {(mode === "login" || mode === "signup" || mode === "forgot" || mode === "reset") && (
            <label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength={160} placeholder="you@example.com" /></label>
          )}
          {(mode === "login" || mode === "signup" || mode === "reset") && (
            <label>{mode === "reset" ? "New password" : "Password"}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} maxLength={72} placeholder="At least 8 characters" /></label>
          )}
          {(mode === "verify" || mode === "reset") && (
            <><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>6-digit OTP<input inputMode="numeric" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value.replace(/\D/g, "").slice(0, 6) })} required pattern="[0-9]{6}" placeholder="000000" /></label></>
          )}
          {error && <p className="form-message" role="alert">{error}</p>}
          {notice && <p className="form-message success" role="status">{notice}</p>}
          <button className="button button-dark auth-submit" type="submit" disabled={pending}>
            {pending ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset OTP" : mode === "verify" ? "Verify email" : mode === "reset" ? "Update password" : "Sign in"} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <div className="auth-switch">
          {mode === "login" && <><button type="button" onClick={() => { setMode("forgot"); setError(""); }}>Forgot password?</button><span /><button type="button" onClick={() => { setMode("signup"); setError(""); }}>Create account</button></>}
          {mode === "signup" && <button type="button" onClick={() => setMode("login")}>Already have an account? Sign in</button>}
          {(mode === "forgot" || mode === "reset" || mode === "verify") && <button type="button" onClick={() => setMode("login")}>Back to sign in</button>}
        </div>
      </section>
    </div>
  );
}

function AccountDrawer({ user, onClose, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/orders/history")
      .then(setOrders)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-backdrop cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="drawer account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <div className="drawer-header"><div><span className="eyebrow">MY ACCOUNT</span><h2 id="account-title">{user.name}</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Close account">×</button></div>
        <div className="account-profile"><span>{user.name.charAt(0).toUpperCase()}</span><div><strong>{user.email}</strong><small>Verified customer</small></div></div>
        <div className="account-history"><div className="account-history-heading"><h3>Purchase history</h3><span>{orders.length} orders</span></div>
          {loading ? <p className="account-empty">Loading your orders…</p> : error ? <p className="form-message" role="alert">{error}</p> : orders.length ? orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-card-head"><div><strong>Order #{order._id.slice(-6).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month:"short", year:"numeric" })}</span></div><span className={`order-status status-${order.status}`}>{order.status === "new" ? "Pending" : order.status}</span></div>
              <div className="order-items">{order.items.map((item, index) => <div key={`${item.productId}-${index}`}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}</div>
              <div className="order-meta"><span>{order.paymentMethod === "razorpay" ? "Razorpay • paid" : order.paymentMethod === "cod" ? "Cash on Delivery" : `UPI • ${order.paymentStatus || "pending"}`}</span>{order.deliveryAddress && <span>{order.deliveryAddress}</span>}</div>
              <div className="order-total"><span>Total</span><strong>{formatPrice(order.subtotal)}</strong></div>
            </article>
          )) : <div className="account-empty"><span>♡</span><p>No orders yet.</p></div>}
        </div>
        <button className="button button-dark account-logout" type="button" onClick={onLogout}>Sign out</button>
      </aside>
    </div>
  );
}

function AddToCartToast({ product, onClose, onViewBag }) {
  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <span className="cart-toast-icon" aria-hidden="true">✓</span>
      <div className="cart-toast-copy">
        <strong>{product.kind === "order" ? product.title : "Added to your basket"}</strong>
        <span>{product.kind === "order" ? "Payment verified" : product.name}</span>
      </div>
      {product.kind !== "order" && <button className="cart-toast-action" type="button" onClick={onViewBag}>View basket</button>}
      <button className="cart-toast-close" type="button" onClick={onClose} aria-label="Close notification">×</button>
    </div>
  );
}

function RecentPurchaseToast({ suspended }) {
  const [purchase, setPurchase] = useState(null);
  const lastPurchaseKey = useRef("");

  useEffect(() => {
    let active = true;
    let hideTimeout;
    let errorLogged = false;

    async function refreshRecentPurchase() {
      try {
        const purchases = await api("/api/orders/recent-purchases");
        errorLogged = false;
        const latestPurchase = purchases[0];
        if (!latestPurchase) {
          lastPurchaseKey.current = "";
          setPurchase(null);
          return;
        }

        const purchaseKey = `${latestPurchase.createdAt}:${latestPurchase.productName}:${latestPurchase.quantity}`;
        if (purchaseKey === lastPurchaseKey.current) return;
        lastPurchaseKey.current = purchaseKey;
        setPurchase(latestPurchase);
        window.clearTimeout(hideTimeout);
        hideTimeout = window.setTimeout(() => {
          if (active) setPurchase(null);
        }, 6500);
      } catch (requestError) {
        if (active && !errorLogged) {
          console.error("Could not load recent purchase notifications:", requestError);
          errorLogged = true;
        }
      }
    }

    refreshRecentPurchase();
    const interval = window.setInterval(refreshRecentPurchase, 20000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearTimeout(hideTimeout);
    };
  }, []);

  if (!purchase || suspended) return null;

  const minutesAgo = Math.max(0, Math.floor((Date.now() - new Date(purchase.createdAt).getTime()) / 60000));
  const timeLabel = minutesAgo === 0 ? "just now" : `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`;

  return (
    <div className="recent-purchase-toast" role="status" aria-live="polite">
      <span className="recent-purchase-icon" aria-hidden="true">✓</span>
      <div className="recent-purchase-copy">
        <strong>Recent purchase</strong>
        <span>{purchase.customerName} from {purchase.city} bought {purchase.productName}{purchase.quantity > 1 ? ` × ${purchase.quantity}` : ""} · {timeLabel}</span>
      </div>
      <button className="cart-toast-close" type="button" onClick={() => setPurchase(null)} aria-label="Close recent purchase notification">×</button>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState(() => new Map());
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartToast, setCartToast] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [checkoutAfterLogin, setCheckoutAfterLogin] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProducts = useCallback((items) => {
    setProducts(items);
    setError("");
  }, []);

  const refreshCategories = useCallback((items) => {
    setCategories(items);
  }, []);

  useEffect(() => {
    let active = true;
    api("/api/products")
      .then((items) => { if (active) setProducts(items); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    api("/api/categories")
      .then((items) => { if (active) setCategories(items); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    api("/api/user/session")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!showAdmin && !showCart && !showAuth && !showAccount && !selectedProduct) return undefined;
    document.body.classList.add("modal-open");
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowAdmin(false);
        setShowCart(false);
        setShowAuth(false);
        setShowAccount(false);
        setSelectedProduct(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAdmin, showCart, showAuth, showAccount, selectedProduct]);

  useEffect(() => {
    if (!cartToast) return undefined;
    const timeout = window.setTimeout(() => setCartToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [cartToast]);

  const categoryNames = useMemo(
    () => [...new Set([...categories.map((item) => item.name), ...products.map((product) => product.category)])],
    [categories, products],
  );
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesQuery = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, products, query]);
  const cartCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const updated = new Map(current);
      const existing = updated.get(product.id);
      updated.set(product.id, { product, quantity: (existing?.quantity || 0) + 1 });
      return updated;
    });
    setCartToast(product);
  }

  function changeQuantity(id, delta) {
    setCart((current) => {
      const updated = new Map(current);
      const item = updated.get(id);
      if (!item) return current;
      if (item.quantity + delta < 1) updated.delete(id);
      else updated.set(id, { ...item, quantity: item.quantity + delta });
      return updated;
    });
  }

  async function placeOrder(checkout) {
    if (!user) {
      setCheckoutAfterLogin(true);
      setShowAuth(true);
      return;
    }
    if (!checkout) return;

    setPaymentPending(true);
    try {
      const items = [...cart.values()].map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
      }));
      const paymentOrder = await api("/api/payment/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, phone: checkout.phone, address: checkout.address, city: checkout.city, showPublicPurchase: checkout.showPublicPurchase }),
      });
      await loadRazorpayCheckout();
      if (typeof window.Razorpay !== "function") {
        throw new Error("Secure payment checkout is unavailable. Please try again.");
      }

      const payment = await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: "Rajendra Puja Store",
          description: "Puja essentials",
          order_id: paymentOrder.razorpayOrderId,
          prefill: { name: user.name, email: user.email, contact: checkout.phone },
          theme: { color: "#365d43" },
          modal: { ondismiss: () => reject(new Error("Payment was cancelled. No order has been placed.")) },
          handler: resolve,
        });
        razorpay.on("payment.failed", (result) => {
          reject(new Error(result.error?.description || "Payment failed. No order has been placed."));
        });
        razorpay.open();
      });

      const order = await api("/api/payment/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        }),
      });
      setCartToast({
        kind: "order",
        title: order.emailStatus === "sending"
          ? "Order confirmed — email confirmation is being attempted"
          : order.emailStatus === "not_configured"
            ? "Order confirmed — email is not configured; please contact the store"
            : order.emailSent
              ? "Order confirmed — details sent to your email"
              : "Order confirmed",
      });
      setCart(new Map());
      setShowCart(false);
    } finally {
      setPaymentPending(false);
    }
  }

  function requireCheckoutSignIn() {
    setCheckoutAfterLogin(true);
    setShowAuth(true);
  }

  async function logoutUser() {
    await api("/api/user/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setShowAccount(false);
  }

  return (
    <>
      <div className="announcement"><span>Shubh Labh · Puja essentials for every sacred moment</span><span className="announcement-dot">✳</span><span>Secure online payments</span></div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Rajendra Puja Store home"><span className="brand-mark">R</span><span className="brand-name">Rajendra <span>Puja Store</span></span></a>
        <nav className="main-nav" aria-label="Main navigation"><a href="#shop">Puja essentials</a><a href="#story">Our promise</a></nav>
        <div className="header-actions">
          <button className="icon-button admin-trigger" type="button" onClick={() => setShowAdmin(true)} aria-label="Admin sign in" title="Admin sign in"><Icon name="settings" /></button>
          <button className="account-button" type="button" onClick={() => user ? setShowAccount(true) : setShowAuth(true)} aria-label={user ? `Open account for ${user.name}` : "Sign in"}>
            {user ? user.name.charAt(0).toUpperCase() : "Sign in"}
          </button>
          <button className="cart-button" type="button" onClick={() => setShowCart(true)} aria-label={`Open puja basket, ${cartCount} items`}><Icon name="bag" /><span>Basket</span><span className="cart-count">{cartCount}</span></button>
        </div>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line" /> FOR EVERY PRAYER & CELEBRATION</span><h1 id="hero-title">Make every<br /><em>ritual special.</em></h1><p>Discover puja essentials for daily worship, festive rituals, and the sacred moments you cherish.</p><a className="button button-dark" href="#shop">Shop puja essentials <span aria-hidden="true">↗</span></a><div className="hero-note"><span className="note-stars">✳ ✳ ✳</span> Selected with devotion, delivered with care</div></div>
          <div className="hero-art" aria-label="A glowing diya for your daily worship"><div className="hero-art-image" /><div className="puja-mandala" aria-hidden="true">✺</div><div className="puja-diya" aria-hidden="true">🪔</div><div className="image-stamp"><span>SHUBH<br />LABH</span><span className="stamp-sparkle">✳</span></div><div className="hero-caption"><span>ॐ</span><span>Bring home a little more devotion</span></div></div>
          <div className="hero-side-label">A LITTLE DEVOTION IN EVERY DETAIL</div>
        </section>
        <section className="promise-strip" id="story" aria-label="Our promise"><div><span className="promise-icon">✳</span><span>Essentials for daily puja & festivals</span></div><div><span className="promise-icon">♡</span><span>Personal service, always</span></div><div><span className="promise-icon">↗</span><span>Secure online checkout</span></div></section>
        <section className="shop-section" id="shop">
          <div className="section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> RAJENDRA PUJA STORE</span><h2>Puja essentials for <em>every ritual.</em></h2></div><label className="search-box"><Icon name="search" /><input type="search" placeholder="Search diya, incense, puja samagri..." aria-label="Search puja products" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
          <div className="shop-toolbar">
            <div className="category-list" aria-label="Filter by category">
              <button className={`category-chip${category === "All" ? " active" : ""}`} type="button" onClick={() => setCategory("All")} aria-pressed={category === "All"}>
                <span className="category-circle category-all" aria-hidden="true">✳</span><span className="category-name">All</span>
              </button>
              {categoryNames.map((name) => {
                const item = categories.find((entry) => entry.name === name);
                return (
                  <button className={`category-chip${category === name ? " active" : ""}`} type="button" key={name} onClick={() => setCategory(name)} aria-pressed={category === name}>
                    {item?.imageUrl ? <img className="category-circle" src={item.imageUrl} alt="" loading="lazy" /> : <span className="category-circle category-placeholder" aria-hidden="true">✳</span>}
                    <span className="category-name">{name}</span>
                  </button>
                );
              })}
            </div>
            <span className="product-total">{visibleProducts.length} {visibleProducts.length === 1 ? "good thing" : "good things"}</span>
          </div>
          {error && <div className="shop-message" role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Try again</button></div>}
          {loading ? <div className="empty-state"><span>✳</span><h3>Preparing your puja collection…</h3></div> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onView={setSelectedProduct} />)}</div> : (
            <div className="empty-state"><span>{products.length ? "✳" : "♡"}</span><h3>{products.length ? "No items match your search." : "Puja essentials are coming soon."}</h3><p>{products.length ? "Try another search or category." : "Please check back soon for items for your worship and celebrations."}</p></div>
          )}
        </section>
        <section className="closing-banner"><div className="closing-flower" aria-hidden="true">✺</div><div><span className="eyebrow">HERE FOR YOUR EVERY RITUAL</span><h2>Need help choosing?</h2><p>We’re happy to help you find the right puja essentials.</p></div><a className="button button-light" href="https://wa.me/919770857704" target="_blank" rel="noopener noreferrer">Chat with us <span aria-hidden="true">↗</span></a></section>
      </main>
      <footer className="site-footer"><a className="brand footer-brand" href="#"><span className="brand-mark">R</span><span className="brand-name">Rajendra <span>Puja Store</span></span></a><span>Puja essentials for every sacred moment.</span><span>Secure online payments</span><span className="copyright">© {new Date().getFullYear()} Rajendra Puja Store</span></footer>
      {showAdmin && <AdminDialog onClose={() => setShowAdmin(false)} onProductsChange={refreshProducts} onCategoriesChange={refreshCategories} />}
      {showCart && <CartDrawer items={cart} onClose={() => setShowCart(false)} onChange={changeQuantity} onPlaceOrder={placeOrder} onRequireAuth={requireCheckoutSignIn} isAuthenticated={Boolean(user)} isProcessing={paymentPending} />}
      {selectedProduct && <ProductDetailsDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />}
      {showAuth && <AuthDialog onClose={() => { setShowAuth(false); setCheckoutAfterLogin(false); }} onAuthenticated={(authenticatedUser) => {
        setUser(authenticatedUser);
        setShowAuth(false);
        if (checkoutAfterLogin) {
          setCheckoutAfterLogin(false);
          setShowCart(true);
        }
      }} />}
      {showAccount && user && <AccountDrawer user={user} onClose={() => setShowAccount(false)} onLogout={logoutUser} />}
      {cartToast && (
        <AddToCartToast
          product={cartToast}
          onClose={() => setCartToast(null)}
          onViewBag={() => {
            setCartToast(null);
            setShowCart(true);
          }}
        />
      )}
      <RecentPurchaseToast suspended={Boolean(cartToast) || showAdmin || showCart || showAuth || showAccount || Boolean(selectedProduct)} />
      <WhatsAppFloat />
    </>
  );
}
