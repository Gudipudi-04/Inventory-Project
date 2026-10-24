
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Lead = require("./models/Lead");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/crm")
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) =>
    console.log("MongoDB connection error:", err.message)
  );

// Home route
app.get("/", (req, res) => {
  res.send("CRM and Inventory Backend is running!");
});

// CRM: Get all leads
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CRM: Add a new lead
app.post("/api/leads", async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Inventory: Temporary product data
let products = [
  {
    id: 1,
    name: "Laptop",
    category: "Electronics",
    price: 55000,
    stock: 10,
  },
  {
    id: 2,
    name: "Keyboard",
    category: "Accessories",
    price: 1200,
    stock: 4,
  },
  {
    id: 3,
    name: "Monitor",
    category: "Electronics",
    price: 12000,
    stock: 8,
  },
];

// Inventory: Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Inventory backend is running!",
  });
});

// Inventory: Get all products
app.get("/api/products", (req, res) => {
  res.json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Inventory: Add a product
app.post("/api/products", (req, res) => {
  const { name, category, price, stock } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof category !== "string" ||
    !category.trim() ||
    price === undefined ||
    stock === undefined ||
    price === "" ||
    stock === "" ||
    !Number.isFinite(Number(price)) ||
    !Number.isInteger(Number(stock)) ||
    Number(price) < 0 ||
    Number(stock) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter valid product details.",
    });
  }

  const newProduct = {
    id: Date.now(),
    name: name.trim(),
    category: category.trim(),
    price: Number(price),
    stock: Number(stock),
  };

  products.push(newProduct);

  res.status(201).json({
    success: true,
    message: "Product added successfully!",
    data: newProduct,
  });
});

// Inventory: Update a product
app.patch("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((item) => item.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  const { name, category, price, stock } = req.body;

  if (
    (name !== undefined &&
      (typeof name !== "string" || !name.trim())) ||
    (category !== undefined &&
      (typeof category !== "string" || !category.trim())) ||
    (price !== undefined &&
      (price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0)) ||
    (stock !== undefined &&
      (stock === "" ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0))
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter valid product details.",
    });
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json({
    success: true,
    message: "Product updated successfully!",
    data: product,
  });
});

// Inventory: Delete a product
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = products.some((item) => item.id === id);

  if (!exists) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  products = products.filter((item) => item.id !== id);

  res.json({
    success: true,
    message: "Product deleted successfully!",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
