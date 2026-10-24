import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/products";

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "Electronics",
    price: "",
    stock: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load products from the Express backend
  async function fetchProducts() {
    try {
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load products.");
      }

      setProducts(result.data);
    } catch (err) {
      setError(
        "Cannot connect to backend. Check that your backend server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= 5
  );

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock),
    0
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price) * Number(product.stock),
    0
  );

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  async function addProduct(event) {
    event.preventDefault();

    if (
      !name.trim() ||
      price === "" ||
      stock === "" ||
      !Number.isFinite(Number(price)) ||
      !Number.isInteger(Number(stock)) ||
      Number(price) < 0 ||
      Number(stock) < 0
    ) {
      alert("Please enter valid product details.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          price: Number(price),
          stock: Number(stock),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not add product.");
      }

      setProducts((current) => [...current, result.data]);
      setName("");
      setCategory("Electronics");
      setPrice("");
      setStock("");
    } catch (err) {
      setError(err.message || "Could not add product. Check the backend.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not delete product.");
      }

      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      setError(err.message || "Could not delete product.");
    }
  }

  function startEditing(product) {
    setEditingId(product.id);

    setEditForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
    });
  }

  async function saveEdit(id) {
    if (
      !editForm.name.trim() ||
      editForm.price === "" ||
      editForm.stock === "" ||
      !Number.isFinite(Number(editForm.price)) ||
      !Number.isInteger(Number(editForm.stock)) ||
      Number(editForm.price) < 0 ||
      Number(editForm.stock) < 0
    ) {
      alert("Please enter valid product details.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not update product.");
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === id ? result.data : product
        )
      );

      setEditingId(null);
    } catch (err) {
      setError(err.message || "Could not update product.");
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    if (products.length === 0) {
      alert("No products available to export.");
      return;
    }

    const headers = [
      "Product ID",
      "Product Name",
      "Category",
      "Price",
      "Stock",
      "Inventory Value",
    ];

    const rows = products.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.stock,
      Number(product.price) * Number(product.stock),
    ]);

    const escapeCSV = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "inventory-products.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">📦</span>
          <span>StockMaster</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-link active">
            <span>▦</span> Dashboard
          </a>
          <a href="#products" className="nav-link">
            <span>📋</span> Products
          </a>
          <a href="#add-product" className="nav-link">
            <span>＋</span> Add Product
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot"></span>
          Inventory System
          <small>Backend API mode</small>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">INVENTORY MANAGEMENT</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Manage your products and track your stock.
            </p>
          </div>

          <button className="export-button" onClick={exportCSV}>
            ⬇ Export CSV
          </button>
        </header>

        {error && (
          <div className="alert-panel" role="alert">
            <div className="alert-symbol">⚠️</div>
            <div className="alert-content">
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button
                className="action-button edit"
                onClick={fetchProducts}
              >
                Retry loading products
              </button>
            </div>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">📦</div>
            <p>Total Products</p>
            <h2>{products.length}</h2>
            <span>Products in inventory</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">▤</div>
            <p>Total Stock Units</p>
            <h2>{totalStock}</h2>
            <span>Units available</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">⚠</div>
            <p>Low Stock Items</p>
            <h2>{lowStockProducts.length}</h2>
            <span>Stock of 5 or less</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">₹</div>
            <p>Inventory Value</p>
            <h2>
              ₹
              {inventoryValue.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </h2>
            <span>Total stock value</span>
          </div>
        </section>

        {lowStockProducts.length > 0 && (
          <section className="alert-panel">
            <div className="alert-symbol">⚠️</div>
            <div className="alert-content">
              <h3>Low Stock Alert</h3>
              <p>
                {lowStockProducts.length} product(s) have 5 or fewer units.
                Please check the stock and restock when needed.
              </p>
              <div className="alert-products">
                {lowStockProducts.map((product) => (
                  <span className="alert-chip" key={product.id}>
                    {product.name}: {product.stock} left
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="form-card" id="add-product">
          <div className="section-heading">
            <div>
              <h2>＋ Add New Product</h2>
              <p>Add a new item to your inventory.</p>
            </div>
          </div>

          <form className="product-form" onSubmit={addProduct}>
            <label>
              Product Name
              <input
                type="text"
                placeholder="e.g. Wireless Mouse"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Electronics</option>
                <option>Accessories</option>
                <option>Furniture</option>
                <option>Stationery</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </label>

            <label>
              Stock Quantity
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
            </label>

            <button className="add-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : "+ Add Product"}
            </button>
          </form>
        </section>

        <section className="products-card" id="products">
          <div className="section-heading products-heading">
            <div>
              <h2>Product Inventory</h2>
              <p>View, edit, and manage your products.</p>
            </div>

            <input
              className="search-input"
              type="search"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      Loading products from backend...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredProducts.map((product) => {
                      const isEditing = editingId === product.id;
                      const isLowStock = Number(product.stock) <= 5;

                      return (
                        <tr key={product.id}>
                          <td>
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={editForm.name}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    name: event.target.value,
                                  })
                                }
                                aria-label="Product name"
                              />
                            ) : (
                              <strong>{product.name}</strong>
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <select
                                className="table-input"
                                value={editForm.category}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    category: event.target.value,
                                  })
                                }
                                aria-label="Product category"
                              >
                                <option>Electronics</option>
                                <option>Accessories</option>
                                <option>Furniture</option>
                                <option>Stationery</option>
                                <option>Other</option>
                              </select>
                            ) : (
                              <span className="category-label">
                                {product.category}
                              </span>
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <input
                                className="table-input number-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.price}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    price: event.target.value,
                                  })
                                }
                                aria-label="Product price"
                              />
                            ) : (
                              `₹${Number(product.price).toLocaleString(
                                "en-IN"
                              )}`
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <input
                                className="table-input number-input"
                                type="number"
                                min="0"
                                step="1"
                                value={editForm.stock}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    stock: event.target.value,
                                  })
                                }
                                aria-label="Stock quantity"
                              />
                            ) : (
                              product.stock
                            )}
                          </td>

                          <td>
                            {isLowStock ? (
                              <span className="status-badge low">
                                Low Stock
                              </span>
                            ) : (
                              <span className="status-badge available">
                                In Stock
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="action-buttons">
                              {isEditing ? (
                                <>
                                  <button
                                    className="action-button save"
                                    disabled={saving}
                                    onClick={() => saveEdit(product.id)}
                                  >
                                    {saving ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    className="action-button cancel"
                                    disabled={saving}
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="action-button edit"
                                    onClick={() => startEditing(product)}
                                    title="Edit product"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    className="action-button delete"
                                    onClick={() => deleteProduct(product.id)}
                                    title="Delete product"
                                  >
                                    🗑
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          No products found. Try another search or add a
                          product.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </section>

        <footer className="page-footer">
          Inventory Dashboard · Connected to backend API
        </footer>
      </main>
    </div>
  );
}

export default App;
