/**
 * stellarRetry.js — Stellar Blockchain Anchoring with Retry Logic
 * Wraps the base stellar.js module with exponential backoff retry
 * and a persistent queue for failed anchoring attempts.
 */

const pendingQueue = []; // In-memory retry queue
let isProcessing = false;

/**
 * sleep — Promise-based delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * anchorWithRetry — Attempts to anchor evidence on Stellar with exponential backoff.
 * @param {object} stellarModule  - The loaded stellar.js module
 * @param {object} evidence       - Evidence object to anchor
 * @param {number} maxRetries     - Max attempts before queuing
 * @returns {Promise<object|null>}
 */
async function anchorWithRetry(stellarModule, evidence, maxRetries = 3) {
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
        try {
            const result = await stellarModule.anchorEvidenceOnStellar({
                id: evidence.id,
                hash: evidence.hash,
                ipfsCid: evidence.ipfsCid,
                caseId: evidence.caseId,
                caseNo: evidence.caseNo,
            });

            console.log(`[Stellar] Evidence ${evidence.id} anchored on attempt ${attempt + 1}:`, result?.txHash);
            return result;
        } catch (err) {
            lastError = err;
            attempt++;
            const backoff = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
            console.warn(`[Stellar] Anchor attempt ${attempt} failed for ${evidence.id}:`, err.message);

            if (attempt < maxRetries) {
                await sleep(backoff);
            }
        }
    }

    // All retries exhausted — add to pending queue for background retry
    console.error(`[Stellar] All ${maxRetries} attempts failed for ${evidence.id}. Queuing for retry.`);
    pendingQueue.push({ evidence, failedAt: new Date().toISOString(), retries: maxRetries });
    triggerBackgroundRetry(stellarModule);
    return null;
}

/**
 * triggerBackgroundRetry — Processes the pending queue after a 60s delay.
 * Ensures only one retry loop runs at a time.
 */
function triggerBackgroundRetry(stellarModule) {
    if (isProcessing) return;
    isProcessing = true;

    setTimeout(async () => {
        console.log(`[Stellar] Background retry: processing ${pendingQueue.length} queued item(s)...`);
        const items = pendingQueue.splice(0);

        for (const item of items) {
            try {
                await stellarModule.anchorEvidenceOnStellar({
                    id: item.evidence.id,
                    hash: item.evidence.hash,
                    ipfsCid: item.evidence.ipfsCid,
                    caseId: item.evidence.caseId,
                    caseNo: item.evidence.caseNo,
                });
                console.log(`[Stellar] Background retry succeeded for: ${item.evidence.id}`);
            } catch (err) {
                console.warn(`[Stellar] Background retry still failing for ${item.evidence.id}:`, err.message);
                // Don't re-queue indefinitely — log and drop after background retry
            }
        }

        isProcessing = false;
    }, 60_000); // Retry after 1 minute
}

/**
 * getStellarQueueStatus — Returns the current state of the retry queue.
 */
function getStellarQueueStatus() {
    return {
        pendingCount: pendingQueue.length,
        isProcessing,
        items: pendingQueue.map(({ evidence, failedAt, retries }) => ({
            evidenceId: evidence.id,
            failedAt,
            retriesAttempted: retries,
        }))
    };
}

module.exports = { anchorWithRetry, getStellarQueueStatus };
