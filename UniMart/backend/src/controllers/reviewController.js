const prisma = require("prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route GET /api/reviews
 * @access Public
 */
const listReviews = asyncHandler(async (req, res) => {
    const { productId, userId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (productId) where.productId = Number(productId);
    if (userId) where.userId = Number(userId);

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            include: {
                user: { select: { id: true, fullName: true } },
                product: { select: { id: true, title: true } },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.review.count({ where }),
    ]);

    res.json({
        data: reviews,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route GET /api/reviews/:id
 * @access Public
 */
const getReviewById = asyncHandler(async (req, res) => {
    const review = await prisma.review.findUnique({
        where: { id: Number(req.params.id) },
        include: {
            user: { select: { id: true, fullName: true } },
            product: { select: { id: true, title: true } },
        },
    });
    if (!review) throw ApiError.notFound("Review not found");
    res.json(review);
});

/**
 * @route POST /api/reviews
 * @access Private
 * @desc One review per user per product
 */
const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, comment } = req.body;

    const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
    });
    if (!product) throw ApiError.notFound("Product not found");

    const existing = await prisma.review.findFirst({
        where: { productId: Number(productId), userId: req.user.id },
    });
    if (existing)
        throw ApiError.conflict("You have already reviewed this product");

    const review = await prisma.review.create({
        data: {
            productId: Number(productId),
            userId: req.user.id,
            rating: Number(rating),
            comment: comment || null,
        },
        include: {
            user: { select: { id: true, fullName: true } },
        },
    });
    res.status(201).json(review);
});

/**
 * @route PUT /api/reviews/:id
 * @access Private (owner or admin)
 */
const updateReview = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Review not found");
    if (existing.userId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    const { rating, comment } = req.body;
    const review = await prisma.review.update({
        where: { id },
        data: {
            ...(rating != null && { rating: Number(rating) }),
            ...(comment !== undefined && { comment }),
        },
    });
    res.json(review);
});

/**
 * @route DELETE /api/reviews/:id
 * @access Private (owner or admin)
 */
const deleteReview = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Review not found");
    if (existing.userId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    await prisma.review.delete({ where: { id } });
    res.status(204).send();
});

module.exports = {
    listReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
};