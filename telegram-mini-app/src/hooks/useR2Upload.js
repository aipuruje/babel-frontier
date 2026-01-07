import { useState } from 'react';

/**
 * useR2Upload Hook
 * Manages the multi-step process of:
 * 1. Requesting a presigned URL from the backend
 * 2. Uploading the blob directly to Cloudflare R2 via XMLHttpRequest (for progress tracking)
 */
export const useR2Upload = (apiBaseUrl = '') => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const uploadAudio = async (userId, missionId, audioBlob) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);

        try {
            // 1. Get the Presigned URL from the Cloudflare Worker
            const urlResponse = await fetch(`${apiBaseUrl}/api/speaking/get-upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, missionId }),
            });

            if (!urlResponse.ok) {
                const errData = await urlResponse.json();
                throw new Error(errData.error || 'Failed to get upload URL');
            }

            const { url, fileKey } = await urlResponse.json();

            // 2. Perform the direct upload to R2 using XMLHttpRequest 
            // (Used instead of fetch to track upload progress)
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 204) {
                        setIsUploading(false);
                        resolve(fileKey); // Return the key to save in D1
                    } else {
                        reject(new Error(`Upload failed to R2 (Status: ${xhr.status})`));
                    }
                });

                xhr.addEventListener('error', () => {
                    setIsUploading(false);
                    reject(new Error('Network error during upload'));
                });

                xhr.open('PUT', url);
                xhr.setRequestHeader('Content-Type', 'audio/webm');
                xhr.send(audioBlob);
            });

        } catch (err) {
            setError(err.message);
            setIsUploading(false);
            throw err;
        }
    };

    return { uploadAudio, isUploading, progress, error };
};
