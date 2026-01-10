// BrainPackLoader - Loads and caches Brain Pack from KV/R2
// Implements hot-reload with 10min cache, fail-closed on missing pack

import type { Env } from "../index";
import type { BrainPack } from "./types";

const CACHE_TTL_SECONDS = 600; // 10 minutes
const KV_CURRENT_VERSION_KEY = "brain/current_version";
const R2_PACK_PATH_TEMPLATE = "brain/packs/brain_pack_{version}.json";

// In-memory cache at Worker global scope
let cachedPack: BrainPack | null = null;
let cacheExpiry: number = 0;
let cachedVersion: string | null = null;

export class BrainPackLoader {
    /**
     * Load the current brain pack with caching
     * @param env Cloudflare Worker environment
     * @returns Current brain pack
     * @throws Error if pack is missing or invalid (fail-closed)
     */
    async load(env: Env): Promise<BrainPack> {
        const now = Date.now();

        // Check cache validity
        if (cachedPack && now < cacheExpiry) {
            return cachedPack;
        }

        // Load version pointer from KV
        const version = await this.getCurrentVersion(env);

        // If version hasn't changed and we have a cached pack (expired but still valid)
        if (cachedPack && cachedVersion === version) {
            // Refresh cache expiry
            cacheExpiry = now + (CACHE_TTL_SECONDS * 1000);
            return cachedPack;
        }

        // Load fresh pack from R2
        const pack = await this.loadFromR2(env, version);

        // Validate pack
        this.validatePack(pack);

        // Update cache
        cachedPack = pack;
        cachedVersion = version;
        cacheExpiry = now + (CACHE_TTL_SECONDS * 1000);

        return pack;
    }

    /**
     * Get current version from KV
     */
    private async getCurrentVersion(env: Env): Promise<string> {
        if (!env.KV) {
            throw new Error("KV namespace not bound - cannot load brain pack version");
        }

        const version = await env.KV.get(KV_CURRENT_VERSION_KEY);

        if (!version) {
            // Fail closed: no version pointer means system misconfiguration
            throw new Error("Brain pack version pointer not found in KV - system not initialized");
        }

        return version;
    }

    /**
     * Load brain pack JSON from R2
     */
    private async loadFromR2(env: Env, version: string): Promise<BrainPack> {
        if (!env.R2) {
            // Fallback: try loading from local content directory (dev mode)
            return this.loadFromLocal();
        }

        const key = R2_PACK_PATH_TEMPLATE.replace("{version}", version);
        const object = await env.R2.get(key);

        if (!object) {
            throw new Error(`Brain pack not found in R2: ${key}`);
        }

        const json = await object.text();
        const pack = JSON.parse(json) as BrainPack;

        return pack;
    }

    /**
     * Fallback: load from local file (dev mode)
     */
    private async loadFromLocal(): Promise<BrainPack> {
        // In production this path won't exist, but in dev with wrangler we can load directly
        try {
            const response = await fetch('/content/brain_pack_v1.json');
            if (!response.ok) {
                throw new Error(`Failed to load local brain pack: ${response.statusText}`);
            }
            return await response.json() as BrainPack;
        } catch (error) {
            throw new Error(`Brain pack not available - R2 not bound and local fallback failed: ${error}`);
        }
    }

    /**
     * Validate brain pack structure
     */
    private validatePack(pack: BrainPack): void {
        if (!pack.contract || !pack.contract.version) {
            throw new Error("Invalid brain pack: missing contract.version");
        }

        if (!pack.learner_model || !pack.personalization_policy) {
            throw new Error("Invalid brain pack: missing core components");
        }

        // Version format check: v1.0.0
        const versionRegex = /^v\d+\.\d+\.\d+$/;
        if (!versionRegex.test(pack.contract.version)) {
            throw new Error(`Invalid brain pack version format: ${pack.contract.version}`);
        }
    }

    /**
     * Manually reload a specific version (for admin/testing)
     */
    async reload(env: Env, version: string): Promise<void> {
        const pack = await this.loadFromR2(env, version);
        this.validatePack(pack);

        // Update KV pointer
        if (env.KV) {
            await env.KV.put(KV_CURRENT_VERSION_KEY, version);
        }

        // Clear cache to force reload
        cachedPack = null;
        cachedVersion = null;
        cacheExpiry = 0;
    }

    /**
     * Get currently loaded version (from cache)
     */
    getCurrentVersionCached(): string | null {
        return cachedVersion;
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(): boolean {
        return cachedPack !== null && Date.now() < cacheExpiry;
    }

    /**
     * Clear cache (for testing)
     */
    clearCache(): void {
        cachedPack = null;
        cachedVersion = null;
        cacheExpiry = 0;
    }
}

// Singleton instance
export const brainPackLoader = new BrainPackLoader();
