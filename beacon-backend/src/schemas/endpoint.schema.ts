import { z } from "zod";

export const createEndpointSchema = z.object({
    name: z.string().min(1),
    url: z.url(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
})

export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;