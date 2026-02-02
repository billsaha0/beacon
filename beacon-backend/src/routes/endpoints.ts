import { Router, Request } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createEndpointSchema } from "../schemas/endpoint.schema";
import prisma from "../config/prisma";
import { checkEndpoint } from "../services/uptimeChecker";


const router = Router();

interface AuthRequest extends Request {
    user?: { userId: string; role: string }
}

// CREATE ENDPOINT

router.post("/", requireAuth, async (req: AuthRequest, res) => {
    const parsed = createEndpointSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid request data"
        });
    }

    const { name, url, method } = parsed.data;
    const userId = req.user!.userId;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    }
                }
            }
        });

        if (!user || !user.subscription) {
            return res.status(403).json({
                message: "No active subscription"
            });
        }
        
        const plan = user.subscription.plan;

        const endpointCount = await prisma.endpoint.count({
            where: { userId },
        });

        if (endpointCount >= plan.maxEndpoints) {
            return res.status(403).json({
                message: `Endpoint limit reached for ${plan.name} plan`
            });
        }
        
        const endpoint = await prisma.endpoint.create({
            data: {
                name,
                url,
                method: method ?? "GET",
                userId,
            }
        });

        await checkEndpoint(endpoint);

        return res.status(201).json(endpoint);

    }
    catch (e) {
        return res.status(500).json({
            message: "Failed to create endpoint"
        });
    }
});

// FETCH ENDPOINTS

router.get("/", requireAuth, async (req: AuthRequest, res) => {
        const userId = req.user!.userId;

    try {

        const endpoints = await prisma.endpoint.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return res.json(endpoints);
    }
    catch (e) {
        return res.status(500).json({
            message: "Failed to fetch enpoints"
        });
    }
});

// DELETE ENDPOINT

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const endpointIdParam = req.params.id;
    const endpointId = Array.isArray(endpointIdParam) ? endpointIdParam[0] : endpointIdParam;

    if (!endpointId) {
        return res.status(400).json({
            message: "Missing id"
        })
    }

    try {
        const endpoint = await prisma.endpoint.findUnique({
            where: { id: endpointId },
        });

        if (!endpoint || endpoint.userId !== userId) {
            return res.status(404).json({
                message: "Endpoint not found"
            });
        }

        await prisma.endpoint.delete({
            where: { id: endpointId },
        });

        return res.status(204).send();
    }
    catch (e) {
        console.log("ERROR: ",e);
        return res.status(500).json({
            message: "Failed to delete endpoint"
        });
    }
});

// CHECK ENDPOINT: Fetches recent uptime check results for a given endpoint

router.get("/:id/checks", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const endpointIdParam = req.params.id;
    const endpointId = Array.isArray(endpointIdParam) ? endpointIdParam[0] : endpointIdParam;

    if (!endpointId) {
        return res.status(400).json({
            message: "Missing id"
        })
    }

    try {
        const endpoint = await prisma.endpoint.findUnique({
            where: { id: endpointId },
        });

        if (!endpoint || endpoint.userId !== userId) {
            return res.status(404).json({
                message: "Endpoint not found"
            });
        }

        const checks = await prisma.checkResult.findMany({
            where: { endpointId },
            orderBy: { checkedAt: "desc" },
            take: 100,
        });

        return res.json(checks);
    }
    catch (e) {
        return res.status(500).json({
            message: "Failed to fetch uptime history"
        });
    }
});

// CHECK ENDPOINT STATUS

router.get("/:id/status", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const endpointIdParam = req.params.id;
    const endpointId = Array.isArray(endpointIdParam) ? endpointIdParam[0] : endpointIdParam;

    if (!endpointId) {
        return res.status(400).json({
            message: "Missing id"
        })
    }

    try {
        const endpoint = await prisma.endpoint.findUnique({
            where: { id: endpointId },
        });

        if (!endpoint || endpoint.userId !== userId) {
            return res.status(404).json({
                message: "Endpoint not found"
            });
        }

        const lastCheck = await prisma.checkResult.findFirst({
            where: { endpointId },
            orderBy: { checkedAt: "desc" }
        });

        if (!lastCheck) {
            return res.json({
                status: "UNKNOWN",
                lastCheckedAt: null,
                responseMs: null,
                statusCode: null,
            });
        }

        return res.json({
            status: lastCheck.isUp ? "UP" : "DOWN",
            lastCheckedAt: lastCheck.checkedAt,
            responseMs: lastCheck.responseMs,
            statusCode: lastCheck.statusCode,
        });
    }
    catch (e) {
        return res.status(500).json({
            message: "Failed to fetch endpoint status"
        });
    }
});

// UPTIME ENDPOINT: Calculate uptime percentage

router.get("/:id/uptime", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const endpointIdParam = req.params.id;
    const endpointId = Array.isArray(endpointIdParam) ? endpointIdParam[0] : endpointIdParam;

    if (!endpointId) {
        return res.status(400).json({
            message: "Missing id"
        })
    }

    try {
        const endpoint = await prisma.endpoint.findUnique({
            where: { id: endpointId },
            include: {
                user: {
                    include: {
                        subscription: {
                            include: {
                                plan: true
                            },
                        }
                    }
                }
            }
        });

        if (!endpoint || endpoint.userId !== userId) {
            return res.status(404).json({
                message: "Endpoint not found"
            });
        }

        const plan = endpoint.user.subscription?.plan;

        if (!plan) {
            return res.status(403).json({
                message: "No active subscription"
            });
        }

        const since = new Date(
            Date.now() - plan.retentionHrs * 60 * 60 * 1000
        );

        const checks = await prisma.checkResult.findMany({
            where: {
                endpointId,
                checkedAt: { gte: since },
            },
        });

        if (checks.length === 0) {
            return res.json({
                uptimePercent: null,
                totalChecks: 0,
                upChecks: 0,
            });
        }

        const upChecks = checks.filter((c) => c.isUp).length;
        const uptimePercent = (upChecks / checks.length) * 100;

        return res.json({
            uptimePercent: Number(uptimePercent.toFixed(2)),
            totalChecks: checks.length,
            upChecks,
            windowHrs: plan.retentionHrs,
        });
    }
    catch (e) {
        return res.status(500).json({
            message: "Failed to calculate uptime"
        });
    }
})

export default router;