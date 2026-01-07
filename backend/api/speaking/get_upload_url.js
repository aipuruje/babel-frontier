import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * GET /api/speaking/get-upload-url
 * Issues a 10-minute presigned URL for direct-to-R2 audio uploads.
 * Hardened for 2026 Production Spec.
 */
export async function handleGetUploadUrl(request, env, corsHeaders) {
    try {
        const { userId, missionId } = await request.json();

        if (!userId || !missionId) {
            return new Response(JSON.stringify({ error: 'userId and missionId are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const fileKey = `uploads/${userId}/${missionId}-${Date.now()}.webm`;

        const S3 = new S3Client({
            region: "auto",
            endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.R2_ACCESS_KEY,
                secretAccessKey: env.R2_SECRET_KEY,
            },
        });

        const url = await getSignedUrl(S3, new PutObjectCommand({
            Bucket: "babel-frontier-speaking-assets",
            Key: fileKey,
            ContentType: "audio/webm",
        }), { expiresIn: 600 });

        return new Response(JSON.stringify({ url, fileKey }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
