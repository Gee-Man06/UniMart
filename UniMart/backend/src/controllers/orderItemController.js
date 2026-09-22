const prisma = require("prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route GET /api/order-items
 * @access Private
 */
const listOrderItems = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.orderId) where.orderId = Number(req.query.orderId);

    // Non-admins only see items belonging to their own orders
    if (req.user.role !== "admin") {
        where.order = { buyerId: req.user.id };
    }

    const items = await prisma.orderItem.findMany({
        where,
        include: {
            product: true,
            order: { select: { id: true, buyerId: true, status: true } },
        },
        orderBy: { id: "desc" },
    });
    res.json(items);
});

/**
 * @route GET /api/order-items/:id
 * @access Private (owner or admin)
 */
const getOrderItemById = asyncHandler(async (req, res) => {
    const item = await prisma.orderItem.findUnique({
        where: { id: Number(req.params.id) },
        include: {
            product: true,
            order: { select: { id: true, buyerId: true, status: true } },
        },
    });
    if (!item) throw ApiError.notFound("Order item not found");
    if (item.order.buyerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    res.json(item);
});

/**
 * @route POST /api/order-items
 * @access Private (buyer/admin)
 */
const createOrderItem = asyncHandler(async (req, res) => {
    const { orderId, productId, quantity } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.buyerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    const product = await prisma.product.findUnique({
        where: { id: productId },
    });
    if (!product) throw ApiError.notFound("Product not found");
    if (product.stock < quantity)
        throw ApiError.badRequest("Insufficient stock");

    const item = await prisma.$transaction(async (tx) => {
        await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: quantity } },
        });
        return tx.orderItem.create({
            data: { orderId, productId, quantity },
            include: { product: true },
        });
    });

    res.status(201).json(item);
});

/**
 * @route PUT /api/order-items/:id
 * @access Private (owner or admin)
 */
const updateOrderItem = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { quantity } = req.body;

    const existing = await prisma.orderItem.findUnique({
        where: { id },
        include: { order: true },
    });
    if (!existing) throw ApiError.notFound("Order item not found");
    if (existing.order.buyerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    const diff = quantity - existing.quantity;

    const item = await prisma.$transaction(async (tx) => {
        if (diff !== 0) {
            await tx.product.update({
                where: { id: existing.productId },
                data: { stock: { decrement: diff } },
            });
        }
        return tx.orderItem.update({
            where: { id },
            data: { quantity },
            include: { product: true },
        });
    });

    res.json(item);
});

/**
 * @route DELETE /api/order-items/:id
 * @access Private (owner or admin)
 */
const deleteOrderItem = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const existing = await prisma.orderItem.findUnique({
        where: { id },
        include: { order: true },
    });
    if (!existing) throw ApiError.notFound("Order item not found");
    if (existing.order.buyerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    await prisma.$transaction(async (tx) => {
        // Restore stock
        await tx.product.update({
            where: { id: existing.productId },
            data: { stock: { increment: existing.quantity } },
        });
        await tx.orderItem.delete({ where: { id } });
    });

    res.status(204).send();
});

module.exports = {
    listOrderItems,
    getOrderItemById,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem,
};