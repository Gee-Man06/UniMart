const prisma = require(".prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route GET /api/orders
 * @access Private (buyer sees own, admin sees all)
 */
const listOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;

    const where = req.user.role === "admin" ? {} : { buyerId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: { include: { product: true } },
                buyer: { select: { id: true, fullName: true, email: true } },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where }),
    ]);

    res.json({
        data: orders,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route GET /api/orders/:id
 * @access Private (owner or admin)
 */
const getOrderById = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: Number(req.params.id) },
        include: {
            items: { include: { product: true } },
            buyer: { select: { id: true, fullName: true, email: true } },
        },
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.buyerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    res.json(order);
});

/**
 * @route POST /api/orders
 * @access Private (buyer/admin)
 * @desc Creates an order with items in a single transaction, validating stock
 */
const createOrder = asyncHandler(async (req, res) => {
    const { items } = req.body; // [{ productId, quantity }]

    const order = await prisma.$transaction(async (tx) => {
        let totalAmount = 0;

        // 1. Validate all products & stock
        const products = [];
        for (const item of items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
            });
            if (!product)
                throw ApiError.badRequest(`Product ${item.productId} not found`);
            if (product.stock < item.quantity)
                throw ApiError.badRequest(
                    `Insufficient stock for "${product.title}" (available: ${product.stock})`
                );
            products.push({ product, quantity: item.quantity });
            totalAmount += product.price * item.quantity;
        }

        // 2. Decrement stock
        await Promise.all(
            products.map(({ product, quantity }) =>
                tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: quantity } },
                })
            )
        );

        // 3. Create order + items
        const created = await tx.order.create({
            data: {
                buyerId: req.user.id,
                status: "pending",
                items: {
                    create: products.map(({ product, quantity }) => ({
                        productId: product.id,
                        quantity,
                    })),
                },
            },
            include: { items: { include: { product: true } } },
        });

        return { ...created, totalAmount };
    });

    res.status(201).json(order);
});

/**
 * @route PUT /api/orders/:id/status
 * @access Private (seller/admin)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status))
        throw ApiError.badRequest(`Invalid status. Allowed: ${allowed.join(", ")}`);

    const order = await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: { status },
    });
    res.json(order);
});

/**
 * @route DELETE /api/orders/:id
 * @access Private (admin)
 * @desc Restores stock when cancelling
 */
const deleteOrder = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
    });
    if (!order) throw ApiError.notFound("Order not found");

    await prisma.$transaction(async (tx) => {
        // Restore stock
        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
            });
        }
        await tx.order.delete({ where: { id } });
    });

    res.status(204).send();
});

module.exports = {
    listOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
};