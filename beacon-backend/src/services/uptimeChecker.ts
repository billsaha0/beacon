import axios from "axios";
import prisma from "../config/prisma";
import { Endpoint, Plan, Subscription, User } from "../generated/prisma/client";

type EndpointWithPlan = Endpoint & {
  user: User & {
    subscription: (Subscription & {
      plan: Plan;
    }) | null;
  };
};

export async function checkEndpoint(endpoint: Endpoint) {
  const start = Date.now();

  try {
        const response = await axios.request({
            url: endpoint.url,
            method: endpoint.method,
            timeout: 5000,
            validateStatus: () => true,
        });

        const responseMs = Date.now() - start;

        await prisma.checkResult.create({
            data: {
                endpointId: endpoint.id,
                statusCode: response.status,
                responseMs,
                isUp: response.status >= 200 && response.status < 400,
            },
        });
    } 
  catch {
    const responseMs = Date.now() - start;

    await prisma.checkResult.create({
      data: {
        endpointId: endpoint.id,
        statusCode: 0,
        responseMs,
        isUp: false,
      },
    });
  }

  await prisma.endpoint.update({
    where: { id: endpoint.id },
    data: { lastCheckedAt: new Date() },
  });
}

export const runUptimeChecks = async () => {
    const now = new Date();
    
    const endpoints = await prisma.endpoint.findMany({
        where: { isActive: true },
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

    for (const endpoint of endpoints as EndpointWithPlan[]) {
        const plan = endpoint.user.subscription?.plan;

        if (!plan) {
            continue;
        }

        const intervalMs = plan.checkInterval * 60 * 1000;

        if (endpoint.lastCheckedAt && now.getTime() - endpoint.lastCheckedAt.getTime() < intervalMs) {
            continue;
        }
        
        await checkEndpoint(endpoint);
    }
}