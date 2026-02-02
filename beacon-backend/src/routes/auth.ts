import { Router, Request } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema, signupSchema } from "../schemas/auth.schema";
import prisma from "../config/prisma";
import { requireAuth } from "../middleware/requireAuth";


const router = Router();

// SIGNUP ENDPOINT

router.post("/signup", async (req, res) => {
    try {
        const parsed = signupSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const { email, password } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            })
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const freePlan = await prisma.plan.findUnique({
            where: { name: "Free" },
        })

        if (!freePlan) {
            return res.status(500).json({
                message: "Free plan not found"
            })
        }

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                subscription: {
                    create: {
                        planId: freePlan.id,
                    }
                }
            }
        })

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }

    catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Internal server error!"
        })
    }
});

// LOGIN ENDPOINT

router.post("/login", async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {            
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Internal server error!"
        })
    }
})

// ME ENDPOINT

interface AuthRequest extends Request {
    user?: { userId: string; role: string }
}

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            subscription: {
                include: {
                    plan: true
                }
            }
        }
    });

    return res.json(user);
})

export default router;