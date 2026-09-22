const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route GET /api/notifications
 * @access Private
 */
const listNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, all } = req.query;

    const where =
        req.user.role === "admin" && all ? {} : { userId: req.user.id };

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
    ]);

    res.json({
        data: notifications,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route GET /api/notifications/:id
 * @access Private (owner or admin)
 */
const getNotificationById = asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({
        where: { id: Number(req.params.id) },
    });
    if (!n) throw ApiError.notFound("Notification not found");
    if (n.userId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();
    res.json(n);
});

/**
 * @route POST /api/notifications
 * @access Private (admin)
 */
const createNotification = asyncHandler(async (req, res) => {
    const { userId, message } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    const n = await prisma.notification.create({
        data: { userId: Number(userId), message },
    });
    res.status(201).json(n);
});

/**
 * @route PUT /api/notifications/:id
 * @access Private (owner)
 */
const updateNotification = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Notification not found");
    if (existing.userId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    const n = await prisma.notification.update({
        where: { id },
        data: { message: req.body.message },
    });
    res.json(n);
});

/**
 * @route DELETE /api/notifications/:id
 * @access Private (owner or admin)
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Notification not found");
    if (existing.userId !== req.user.id && req.user.role !== "admin")
        throw ApiError.forbidden();

    await prisma.notification.delete({ where: { id } });
    res.status(204).send();
});

module.exports = {
    listNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
};