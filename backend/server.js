const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api', productRoutes);
app.use('/api', authRoutes);
app.use('/api', orderRoutes);
app.use('/api', chatRoutes);

app.use(express.static(path.join(__dirname, '../Front-end-V-B')));

app.listen(PORT, () => {
  console.log(`servidor iniciado em http://localhost:${PORT}`);
});
