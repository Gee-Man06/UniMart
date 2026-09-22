const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const USER_SELECT = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    createdAt: true,
};

const signToken = (user) =>
    jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

/**
 * @route POST /api/users/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw ApiError.conflict("Email already registered");

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            password: hashed,
            role: role === "seller" ? "seller" : "buyer",
        },
        select: USER_SELECT,
    });

    const token = signToken(user);
    res.status(201).json({ user, token });
});

/**
 * @route POST /api/users/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid credentials");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw ApiError.unauthorized("Invalid credentials");

    const token = signToken(user);
    res.json({
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
    });
});

/**
 * @route GET /api/users/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: USER_SELECT,
    });
    if (!user) throw ApiError.notFound("User not found");
    res.json(user);
});

/**
 * @route GET /api/users
 * @access Private (admin)
 */
const listUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, q } = req.query;

    const where = {};
    if (role) where.role = role;
    if (q) {
        where.OR = [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: USER_SELECT,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
    ]);

    res.json({
        data: users,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route GET /api/users/:id
 * @access Private
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(req.params.id) },
        select: USER_SELECT,
    });
    if (!user) throw ApiError.notFound("User not found");
    res.json(user);
});

/**
 * @route PUT /api/users/:id
 * @access Private (self or admin)
 */
const updateUser = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (req.user.id !== id && req.user.role !== "admin")
        throw ApiError.forbidden();

    const { fullName, email, password, role } = req.body;
    const data = {};
    if (fullName) data.fullName = fullName;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (role && req.user.role === "admin") data.role = role;

    const user = await prisma.user.update({
        where: { id },
        data,
        select: USER_SELECT,
    });
    res.json(user);
});

/**
 * @route DELETE /api/users/:id
 * @access Private (self or admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (req.user.id !== id && req.user.role !== "admin")
        throw ApiError.forbidden();

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
});

module.exports = {
    register,
    login,
    getMe,
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
};