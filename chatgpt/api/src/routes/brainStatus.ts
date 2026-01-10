// Test endpoint for Brain Pack status
// GET /api/brain/status - Returns current brain pack version and cache status

import type { Env } from "../index";
import { json } from "../utils/http";
import { brainPackLoader } from "../brain/BrainPackLoader";

export async function handleBrainStatus(
    req: Request,
    env: Env
): Promise<Response> {
    try {
        // Attempt to load brain pack
        const pack = await brainPackLoader.load(env);

        return json({
            ok: true,
            status: "operational",
            version: pack.contract.version,
            region: pack.contract.region,
            default_locale: pack.contract.default_locale,
            cache_status: {
                is_valid: brainPackLoader.isCacheValid(),
                current_version: brainPackLoader.getCurrentVersionCached(),
            },
            capabilities: {
                learner_model: true,
                personalization: true,
                telemetry: true,
                coach_engine: true,
                payments: pack.payments_contract.supported_gateways,
            },
        });
    } catch (error) {
        return json({
            ok: false,
            status: "error",
            error: String(error),
            message: "Brain Pack failed to load - check KV/R2 configuration",
        }, 500);
    }
}
