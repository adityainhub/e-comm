const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const verifyToken = require("./verifyToken"); // Assuming you have a middleware for token verification
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Enable CORS with specific origin
app.use(cors({ origin: "http://127.0.0.1:3000" }));

app.use(express.static('src')); // Adjust the 'public' to your static files directory

// MySQL database configuration
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "DBMS@2560",
  database: "online_retail_store",
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1); // Exit the process if unable to connect to MySQL
  }
  console.log("Connected to MySQL database");
});

app.get('/', (req, res) => {
  res.send('Welcome to the Home Page!');
});
// Route to handle user login
// Route to handle user login using GET request
app.get("/login", (req, res) => {
  const { username, password } = req.query; // Extract username and password from query parameters

  // Check if username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  // Query the database to find the user with the provided username
  connection.query(
    "SELECT * FROM Customer WHERE Username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Check if the user exists
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const user = results[0];

      // Check if the password matches
      if (user.Pass !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // If username and password are correct, generate JWT
      const token = jwt.sign({ userId: user.CustomerID }, "your_secret_key", {
        expiresIn: "1h",
      });
      // Return the token and user information
      res.json({ message: "Login successful", token, user });
    }
  );
});

// Route to handle user registration
app.post("/register", (req, res) => {
  const {
    firstName,
    lastName,
    dob,
    email,
    phoneNumber,
    username,
    password,
    chestSize,
    waistSize,
    shoeSize,
  } = req.body;

  // Validate the form data
  if (
    !firstName ||
    !lastName ||
    !dob ||
    !email ||
    !phoneNumber ||
    !username ||
    !password ||
    !chestSize ||
    !waistSize ||
    !shoeSize
  ) {
    return res
      .status(400)
      .json({ error: "Please fill in all required fields" });
  }

  // Insert registration data into the Customer table
  const insertQuery = `
    INSERT INTO Customer (FirstName, LastName, DateOfBirth, EmailAddress, TelephoneNumber, Username, Pass, DefaultChestSize, DefaultWaistSize, DefaultShoeSize)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    firstName,
    lastName,
    dob,
    email,
    phoneNumber,
    username,
    password,
    chestSize,
    waistSize,
    shoeSize,
  ];

  connection.query(insertQuery, values, (error, results, fields) => {
    if (error) {
      console.error("Error inserting registration data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    console.log("Registration data inserted successfully");
    res.status(200).json({ message: "Registration successful" });
  });
});

// Route to fetch user account information
app.get("/user/account", verifyToken, (req, res) => {
  // Extract userId from token
  const userId = req.user.userId;

  // Query the database to fetch user account information
  connection.query(
    "SELECT * FROM Customer where CustomerID = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching user account details:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Check if the user exists
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return the user account information
      const userInfo = results[0];
      res.json(userInfo);
    }
  );
});
// Route to fetch user's order history
app.get("/user/orders", verifyToken, (req, res) => {
  // Extract userId from token
  const userId = req.user.userId;

  // Query the database to fetch user's order history
  connection.query(
    "SELECT * FROM Orders WHERE CustomerID = ?",
    [userId],
    (err, orders) => {
      if (err) {
        console.error("Error fetching user's order history:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Check if the user has any orders
      if (orders.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this user" });
      }

      // Return the user's order history
      res.json(orders);
    }
  );
});
app.get("/getStoreDetails", (req, res) => {
  const storeId = req.query.storeId;
  // Query to retrieve store details by ID
  const query = "SELECT * FROM Store WHERE StoreID = ?";

  // Execute query
  connection.query(query, [storeId], (error, results) => {
    if (error) {
      console.error("Error retrieving store details: ", error);
      res.status(500).send("Error retrieving store details");
      return;
    }

    // Check if store with the given ID exists
    if (results.length === 0) {
      res.status(404).send("Store not found");
      return;
    }

    // Send retrieved store details as response
    res.json(results[0]);
  });
});


app.post("/deletestore", (req, res) => {
  const storeId = req.body.storeID;

  if (!storeId) {
    res.status(400).send("Store ID is required");
    return;
  }

  // Query to delete the store
  const query = `Update Store SET Active=0  WHERE StoreID = ?`;

  connection.query(query, [storeId], (error, results, fields) => {
    if (error) {
      console.error("Error deleting store: " + error.stack);
      res.status(500).send("Error deleting store");
      return;
    }

    if (results.affectedRows === 0) {
      res.status(404).send("Store not found");
      return;
    }

    console.log("Deleted store with ID " + storeId);
    res.status(200).send("Store deleted successfully");
  });
});


app.post("/InsertProducts", (req, res) => {
  const {
    ItemName,
    Brand,
    Descr,
    IMAGEURL,
    Price,
    ProductCategory,
    ProductSubCategory,
  } = req.body;

  const sql = `INSERT INTO Product (ItemName, Brand, Descr, IMAGEURL, Price, ProductCategory, ProductSubCategory) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    ItemName,
    Brand,
    Descr,
    IMAGEURL,
    Price,
    ProductCategory,
    ProductSubCategory,
  ];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error adding product:", err);
      res.status(500).json({ error: "Failed to add product" });
    } else {
      const productId = result.insertId;

      res
        .status(200)
        .json({ message: "Product added successfully", productId });
    }
  });
});

// Route to delete a product by its ID
app.delete("/deleteProducts", (req, res) => {
  const productId = req.query.productId;

  const sql = `Update Product SET Active=0 WHERE ProductID = ?;
  `;

  connection.query(sql, productId, (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ error: "Failed to delete product" });
    } else {
      if (result.affectedRows > 0) {
        console.log("Product deleted successfully");
        res.status(200).json({ message: "Product deleted successfully" });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    }
  });
});


// Define route to get all orders sorted by date
app.get("/allOrders", (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query._page) || 1; // Default page is 1 if not provided
  const limit = parseInt(req.query._limit) || 20; // Default limit is 20 if not provided

  // Calculate the offset based on page number and limit
  const offset = (page - 1) * limit;

  // Query to fetch orders with pagination and sorting by date
  const query = `
      SELECT * 
      FROM Orders 
      ORDER BY DateTimeOfOrderPlaced DESC
      LIMIT ${limit} OFFSET ${offset};
  `;

  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Query to count total number of orders
    const countQuery = `
          SELECT COUNT(*) AS totalOrders
          FROM Orders;
      `;

    // Execute count query to get total number of orders
    connection.query(countQuery, (countErr, countResults) => {
      if (countErr) {
        console.error("Error executing MySQL count query: ", countErr);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      // Send the retrieved orders along with total count as response
      const totalCount = countResults[0].totalOrders;
      res.setHeader("X-Total-Count", totalCount);
      res.json(results);
    });
  });
});

// Route to fetch products data
app.get("/products", (req, res) => {
  connection.query("SELECT * FROM Product", (err, products) => {
    if (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(products);
  });
});

// Route to fetch top 3 testimonials
app.get("/testimonials", (req, res) => {
  connection.query(
    "SELECT f.Content, f.Rating, c.FirstName, c.LastName FROM Feedback f JOIN Customer c ON f.CustomerID = c.CustomerID ORDER BY f.Rating DESC LIMIT 3",
    (err, testimonials) => {
      if (err) {
        console.error("Error fetching testimonials:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.json(testimonials);
    }
  );
});


// Route to get details of all stores with manager names
app.get("/stores", (req, res) => {
  const query = `
    SELECT 
      Store.*,
      Manager.FullName AS ManagerName
    FROM 
      Store
    INNER JOIN 
      Manager ON Store.ManagerID = Manager.ManagerID
  `;

  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching stores with manager names: " + err.stack);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    // Send the results as JSON response
    res.json(results);
  });
});

// Route to fetch feedbacks data by productId
app.get("/feedbacks/:productId", (req, res) => {
  const productId = req.params.productId;
  connection.query(
    "SELECT AVG(f.Rating) AS AverageRating FROM Feedback f INNER JOIN Orders o ON f.OrderID = o.OrderID WHERE o.ProductID = ?",
    [productId],
    (err, result) => {
      if (err) {
        console.error("Error fetching product rating:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      const averageRating = result[0].AverageRating || 0; // Handle case where there are no ratings yet
      res.json({ productId: productId, averageRating: averageRating });
    }
  );
});
app.post("/add-product-in-store", (req, res) => {
  const { ProductID, AvailableStores, Price } = req.body;

  // Iterate through each selected store and insert the product into the store
  AvailableStores.forEach((store) => {
    const { StoreID, Stock, DiscountPercentage } = store;
    // Example: Insert data into the ProductInStore table
    const query =
      "INSERT INTO ProductInStore (ProductID, StoreID,Price, Stock, DiscountPercentage) VALUES (?, ?, ?,?, ?)";
    connection.query(
      query,
      [ProductID, StoreID, parseInt(Price), Stock, DiscountPercentage],
      (err, results) => {
        if (err) {
          console.error("Error executing query: " + err.stack);
          res.status(500).json({ error: "Internal server error" });
          return;
        }
      }
    );
  });

  res
    .status(200)
    .json({ message: "New product added to store(s) successfully" });
});


app.get("/protected", verifyToken, (req, res) => {
  // If the execution reaches here, it means the token is valid
  res.json({ message: "Access granted!" });
});
// Route to fetch top 5 rated products in hot releases
app.get("/hotReleases", (req, res) => {
  connection.query(
    "SELECT p.ProductID, p.ItemName, p.Price,p.IMAGEURL, AVG(f.Rating) AS AverageRating FROM Product p JOIN Orders o ON p.ProductID = o.ProductID JOIN Feedback f ON o.OrderID = f.OrderID GROUP BY p.ProductID, p.ItemName, p.Brand ORDER BY AverageRating DESC LIMIT 4",
    (err, hotReleases) => {
      if (err) {
        console.error("Error fetching hot releases:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.json(hotReleases);
    }
  );
});

// Route to fetch last 9 added products in latest releases
app.get("/latestReleases", (req, res) => {
  connection.query(
    "SELECT * FROM Product ORDER BY ProductID DESC LIMIT 9",
    (err, latestReleases) => {
      if (err) {
        console.error("Error fetching latest releases:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.json(latestReleases);
    }
  );
});


app.get("/getProductDetails", (req, res) => {
  const productId = req.query.productId;

  // Validate the productId
  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  // Query the database to fetch product details
  connection.query(
    "SELECT * FROM Product WHERE ProductID = ?",
    [productId],
    (err, results) => {
      if (err) {
        console.error("Error fetching product details:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      // Check if the product exists
      if (results.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Return the product details
      const productDetails = results[0];
      res.json(productDetails);
    }
  );
});


// Route to fetch top 4 products from a specified subcategory
app.get("/products/top4related", (req, res) => {
  const subcategory = req.query.subcategory;

  // Validate the subcategory
  if (!subcategory) {
    return res.status(400).json({ error: "Subcategory is required" });
  }

  // Query the database to fetch top 4 products from the specified subcategory
  connection.query(
    "SELECT * FROM Product WHERE ProductCategory = ? ORDER BY ProductID LIMIT 4",
    [subcategory],
    (err, products) => {
      if (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.json(products);
    }
  );
});
app.get("/cart", verifyToken, (req, res) => {
  // Sample logic to fetch cart details from the database
  const customerId = req.user.userId; // Assuming customerId is stored in decoded token

  // Query to fetch cart details
  const query = `
      SELECT c.CartID, p.ItemName, p.Price, s.StoreName, c.Quantity,p.IMAGEURL,s.StoreID,p.ProductID as id,c.priceInStore
      FROM Cart c
      INNER JOIN Product p ON c.ProductID = p.ProductID
      INNER JOIN Store s ON c.StoreID = s.StoreID
      WHERE c.CustomerID = ?
  `;

  // Execute the query
  connection.query(query, [customerId], (err, results) => {
    if (err) {
      console.error("Error fetching cart details:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching cart details" });
    } else {
      res.json(results);
    }
  });
});


app.put("/api/cart/", verifyToken, async (req, res) => {
  const productId = req.query.productId;
  const storeId = req.query.storeId;
  const { quantity } = req.body;
  const customerId = req.user.userId;

  try {
    const sql = `UPDATE Cart SET Quantity = ? WHERE CustomerID = ? AND ProductID = ? AND StoreID = ?`;
    const values = [quantity, customerId, productId, storeId];

    connection.query(sql, values, (error, results, fields) => {
      if (error) {
        console.error("Error updating quantity:", error);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.status(200).send("Quantity updated successfully");
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/deleteFromCart", verifyToken, (req, res) => {
  const productId = req.query.productId;
  const storeId = req.query.storeId;
  const customerId = req.user.userId;

  // Query to delete item from cart
  const query =
    "DELETE FROM Cart WHERE CustomerID = ? AND ProductID = ? AND StoreID = ?";

  connection.query(query, [customerId, productId, storeId], (err, results) => {
    if (err) {
      console.error("Error deleting item from cart:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    res.status(200).json({ message: "Item deleted from cart successfully" });
  });
});


app.post("/make-orders", verifyToken, (req, res) => {
  const products = req.body.products;
  const CustomerID = req.user.userId;

  const promises = products.map((product) => {
    if (product.Quantity > 0) {
      const { StoreID, ProductID, Quantity, paymentMethod, AddressID, Total } =
        product;
      // Insert the order into the database
      const sql = `INSERT INTO Orders (CustomerID, StoreID, ProductID, NumberOfProducts, ModeOfPayment, AddressID,Total) VALUES (?, ?, ?, ?, ?, ?,?)`;

      return new Promise((resolve, reject) => {
        connection.query(
          sql,
          [
            CustomerID,
            StoreID,
            ProductID,
            Quantity,
            paymentMethod,
            AddressID,
            Total,
          ],
          (err, result) => {
            if (err) {
              console.error("Error creating order:", err);
              reject(err);
            } else {
              console.log("Order created successfully", ProductID);
              resolve(result);
            }
          }
        );
      });
    }
  });

  Promise.all(promises)
    .then(() => {
      res.status(200).json({ message: "Orders created successfully" });
    })
    .catch((error) => {
      res.status(500).json({ error: "Error creating order" });
    });
});


app.get("/productInStore", (req, res) => {
  const productId = req.query.productId; // Corrected to req.query.productId

  // Query to fetch stores selling the product with the specified product ID
  const query = `
    SELECT s.StoreID, s.StoreName, pis.Price, pis.Stock, pis.DiscountPercentage
    FROM Store s
    JOIN ProductInStore pis ON s.StoreID = pis.StoreID
    WHERE pis.ProductID = ?
  `;

  // Execute the query
  connection.query(query, [productId], (error, results) => {
    if (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // If results are found, send them as JSON response
    if (results.length > 0) {
      res.json(results);
    } else {
      res
        .status(404)
        .json({ error: "No stores found for the specified product ID" });
    }
  });
});


app.post("/api/add-to-cart", verifyToken, (req, res) => {
  const customerId = req.user.userId;
  const { productId, storeId, quantity, priceInStore } = req.body;

  // Check if all required fields are provided
  if (!customerId || !productId || !storeId || !quantity || !priceInStore) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Insert into Cart table
  const sql = `INSERT INTO Cart (CustomerID, ProductID, StoreID, Quantity, priceInStore) VALUES (?, ?, ?, ?, ?)`;
  const values = [customerId, productId, storeId, quantity, priceInStore];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting into Cart:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    console.log("Item added to cart:", result);
    return res.status(200).json({ message: "Item added to cart successfully" });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
