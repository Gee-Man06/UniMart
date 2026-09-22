const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const VALID_STATUSES = ["pending", "approved", "rejected"];

/**
 * @route GET /api/vendor-verifications
 * @access Private (admin)
 */
const listVerifications = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;

    const [list, total] = await Promise.all([
        prisma.vendorVerification.findMany({
            where,
            include: {
                vendor: { select: { id: true, fullName: true, email: true } },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.vendorVerification.count({ where }),
    ]);

    res.json({
        data: list,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route GET /api/vendor-verifications/me
 * @access Private (seller)
 */
const getMyVerification = asyncHandler(async (req, res) => {
    const v = await prisma.vendorVerification.findUnique({
        where: { vendorId: req.user.id },
    });
    res.json(v || null);
});

/**
 * @route GET /api/vendor-verifications/:id
 * @access Private (admin)
 */
const getVerificationById = asyncHandler(async (req, res) => {
    const v = await prisma.vendorVerification.findUnique({
        where: { id: Number(req.params.id) },
        include: {
            vendor: { select: { id: true, fullName: true, email: true } },
        },
    });
    if (!v) throw ApiError.notFound("Verification not found");
    res.json(v);
});

/**
 * @route POST /api/vendor-verifications
 * @access Private (seller)
 */
const createVerification = asyncHandler(async (req, res) => {
    const existing = await prisma.vendorVerification.findUnique({
        where: { vendorId: req.user.id },
    });
    if (existing)
        throw ApiError.conflict("You have already submitted a verification request");

    const v = await prisma.vendorVerification.create({
        data: { vendorId: req.user.id, status: "pending" },
    });
    res.status(201).json(v);
});

/**
 * @route PUT /api/vendor-verifications/:id
 * @access Private (admin)
 * @desc Approve/reject; promotes the vendor to seller if approved
 */
const updateVerification = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status))
        throw ApiError.badRequest(
            `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`
        );

    const v = await prisma.$transaction(async (tx) => {
        const updated = await tx.vendorVerification.update({
            where: { id },
            data: { status },
        });

        if (status === "approved") {
            await tx.user.update({
                where: { id: updated.vendorId },
                data: { role: "seller" },
            });
        }

        return updated;
    });

    res.json(v);
});

/**
 * @route DELETE /api/vendor-verifications/:id
 * @access Private (admin)
 */
const deleteVerification = asyncHandler(async (req, res) => {
    await prisma.vendorVerification.delete({
        where: { id: Number(req.params.id) },
    });
    res.status(204).send();
});

module.exports = {
    listVerifications,
    getMyVerification,
    getVerificationById,
    createVerification,
    updateVerification,
    deleteVerification,
};