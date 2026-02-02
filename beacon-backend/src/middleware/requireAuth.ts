import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";

interface AuthJwtPayload extends DefaultJwtPayload {
    userId: String;
    role: String;
}

export const requireAuth = (
    req: Request & { user?: AuthJwtPayload },
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authorization header missing"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token missing"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        if (
            typeof decoded === "object" && decoded !== null && "userId" in decoded && "role" in decoded) {
            req.user = decoded as AuthJwtPayload;
            next();
        }
        else {
            return res.status(401).json({
                message: "Invalid token payload"
            })
        }

    } catch (e) {
        return res.status(401).json({
            message: "Invalid token"
        })
    }
}