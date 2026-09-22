class Api extends Error {
    constructor(status, message, details = null) {
        super(message);
        this.status = status;
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }

    static badRequest(msg, details) {
        return new ApiError(400, msg, details);
    }

    static forbidden(msg = "Forbidden") {
        return new ApiError(403, msg);
    }

    static unauthorized(msg = "Unauthorized") {
        return new ApiError(401, msg);
    }

    static notFound(msg = "Not Found") {
        return new ApiError(404, msg);
    }

    static conflict(msg ) {
        return new ApiError(409, msg);
    }
}

module.exports = Api;