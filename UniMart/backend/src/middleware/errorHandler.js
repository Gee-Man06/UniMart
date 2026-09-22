const { Prisma} = require("@prisma/client");
const ApiError = require("../utils/ApiError.js")

function errorHandler(req, res, next) {

    if(err instanceof Prisma.PrismaClientKnownRequestError){
        if(err.code === "P2002"){
            return res.status(409).json({
                error: "Unique constraint violation",
                field: err.meta?.target,
            });
        }

        if(err.code === "P2025"){
            return res.status(404).json({ error: "Record not found" });
        }

        if(err.code === "P2003"){
            return res.status(400).json({ error: "Foreign Key not found." });
        }
    }

    // Prisma validation Error
    if(err instanceof Prisma.PrismaClientValidationError){
        return res.status(400).json({error: "Invalid data provided"});
    }

    //Custom errors
    if(err instanceof ApiError){
        return res
            .status(err.status)
            .json({error: err.message, ...(err.details && { details: err.details })});
    }

    console.error("Unhandled error: ", err);
    res.status(500).json({error: "Internal Server Error"});
}

module.exports.errorHandler = errorHandler;