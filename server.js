import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

// Configure pool - make sure the password matches pgAdmin!
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dthrift',
  password: 'Manav@061104', // <-- Replace with your actual pgAdmin password
  port: 5432,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL Database');
});

// 1. GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// 2. CHECKOUT & UPDATE STOCK / LOG ORDER
app.post('/api/checkout', async (req, res) => {
  const { paymentId, customerName, items, amount } = req.body;

  try {
    await pool.query('BEGIN');

    const orderId = 'ORD-' + Date.now();
    await pool.query(
      `INSERT INTO orders (id, payment_id, customer_name, items, amount, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, paymentId, customerName || 'Verified Customer', JSON.stringify(items), amount, 'Paid']
    );

    for (const item of items) {
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
        [item.quantity || 1, item.id]
      );
    }

    await pool.query('COMMIT');
    res.json({ success: true, orderId });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// 3. GET ALL ORDERS
app.get('/api/orders', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Orders query error:', err.message);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));