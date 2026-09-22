require('dotenv').config();
const cors = require('cors');
const express = require('express');
const errorHandler = require('./middleware/errorHandler.js')

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).send({})
});

app.use("/api/user", require('./routes/userRoutes'));
app.use("/api/products", require('./routes/productRoutes'));
app.use("/api/orders", require('./routes/orderRoutes'));
app.use("/api/orderItems", require('./routes/orderItemRoutes'));
app.use("/api/reviews", require('./routes/reviewRoutes'));
app.use("/api/vendor-verification", require('./routes/vendorVerificationRouter'));
app.use("/api/notification", require('./routes/notificationRoutes'));

app.use((req, res) => {
    res.status(404).json({error: 'Route not found'});
});
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

