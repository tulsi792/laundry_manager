const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/laundryDB')
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));

const Order = mongoose.model("Order", new mongoose.Schema({
    customer_name: String,
    phone: String,
    garments: [{ garment: String, quantity: Number }],
    total: Number,
    status: { type: String, default: "RECEIVED" }
}));

const price = { shirt: 80, pants: 120 };

const ADMIN = { username: "admin", password: "1234" };

function auth(req, res, next) {
    if (req.headers.username === ADMIN.username &&
        req.headers.password === ADMIN.password) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
}

// GET
app.get('/api/orders', auth, async (req, res) => {
    const data = await Order.find();
    res.json(data);
});

// CREATE
app.post('/api/orders', auth, async (req, res) => {
    const { customer_name, phone, garments } = req.body;

    let total = garments.reduce((sum, g) => {
        return sum + price[g.garment] * g.quantity;
    }, 0);

    const order = new Order({ customer_name, phone, garments, total });
    await order.save();

    res.json(order);
});

// UPDATE
app.put('/api/orders/:id', auth, async (req, res) => {
    const updated = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
    );
    res.json(updated);
});

// DELETE
app.delete('/api/orders/:id', auth, async (req, res) => {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

app.listen(5000, () => console.log("Server running on 5000"));