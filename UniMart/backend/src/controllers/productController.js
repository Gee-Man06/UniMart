const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route GET /api/products
 * @access Public
 */
const listProducts = asyncHandler(async (req, res) => {
    const { q, sellerId, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const where = {};
    if (q) where.title = { contains: q, mode: "insensitive" };
    if (sellerId) where.sellerId = Number(sellerId);
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                seller: { select: { id: true, fullName: true } },
                _count: { select: { reviews: true } },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
    ]);

    res.json({
        data: products,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route GET /api/products/:id
 * @access Public
 */
const getProductById = asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
        where: { id: Number(req.params.id) },
        include: {
            seller: { select: { id: true, fullName: true } },
            reviews: {
                include: { user: { select: { id: true, fullName: true } } },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!product) throw ApiError.notFound("Product not found");
    res.json(product);
});

/**
 * @route POST /api/products
 * @access Private (seller/admin)
 */
const createProduct = asyncHandler(async (req, res) => {
    const { title, description, price, stock } = req.body;

    const product = await prisma.product.create({
        data: {
            title,
            description,
            price: Number(price),
            stock: Number(stock ?? 0),
            sellerId: req.user.id,
        },
    });
    res.status(201).json(product);
});

/**
 * @route PUT /api/products/:id
 * @access Private (owner or admin)
 */
const updateProduct = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Product not found");
    if (existing.sellerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    const { title, description, price, stock } = req.body;
    const product = await prisma.product.update({
        where: { id },
        data: {
            ...(title && { title }),
            ...(description && { description }),
            ...(price != null && { price: Number(price) }),
            ...(stock != null && { stock: Number(stock) }),
        },
    });
    res.json(product);
});

/**
 * @route DELETE /api/products/:id
 * @access Private (owner or admin)
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Product not found");
    if (existing.sellerId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
});

module.exports = {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};