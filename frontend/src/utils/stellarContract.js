/**
 * stellarContract.js — LexChain Soroban Contract Integration
 *
 * Provides typed wrappers around every function exposed by the
 * EvidenceAnchorContract deployed on Stellar Testnet.
 *
 * Contract ID: CBIELTK6YBZJU5UP2WWQEQ4YKR525RABARNZHRBIG4DPXNYGZFKC75YA
 * Network    : Stellar Testnet (SDF)
 *
 * Requires:
 *   @stellar/stellar-sdk  (>=v12 — SorobanRpc + Contract helpers)
 *   @stellar/freighter-api (for signTransaction in the browser)
 *
 * Each exported function follows the shape:
 *   { result, error }  — result is null on failure, error is null on success.
 *
 * ─── Contract function map ────────────────────────────────────────────────────
 *   initialize(admin)
 *   get_admin()
 *   add_officer(officer)
 *   add_judge(judge)
 *   anchor_evidence(uploader, id, name, hash, ipfs_cid, case_id, station, evidence_type)
 *   get_evidence(id)
 *   verify_evidence(id, hash)
 *   find_by_hash(hash)
 *   get_case_evidence(case_id)
 *   court_approval(judge, evidence_id, approved)
 *   transfer_custody(current_holder, evidence_id, new_holder, reason)
 *   total_evidence()
 *   version()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';

// ─── Constants ────────────────────────────────────────────────────────────────
export const CONTRACT_ID = 'CBIELTK6YBZJU5UP2WWQEQ4YKR525RABARNZHRBIG4DPXNYGZFKC75YA';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

// ─── SDK clients ──────────────────────────────────────────────────────────────
const server = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

// ─── Helper: build a SorobanDataBuilder for the contract ─────────────────────
function getContract() {
    return new StellarSdk.Contract(CONTRACT_ID);
}

/**
 * Build, simulate, sign (via Freighter), and submit a Soroban transaction.
 *
 * @param {string}   publicKey   — Caller's Stellar public key (from Freighter)
 * @param {xdr.Operation} operation — Contract call operation (from Contract.call)
 * @returns {Promise<{ result: any, error: string|null }>}
 */
async function invokeContract(publicKey, operation) {
    try {
        // 1. Load account
        const account = await horizonServer.loadAccount(publicKey);

        // 2. Build transaction
        const tx = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        // 3. Simulate to get footprint + fee
        const simResult = await server.simulateTransaction(tx);

        if (StellarSdk.SorobanRpc.Api.isSimulationError(simResult)) {
            return { result: null, error: `Simulation failed: ${simResult.error}` };
        }

        // 4. Assemble (apply footprint / auth entries from simulation)
        const assembled = StellarSdk.SorobanRpc.assembleTransaction(tx, simResult).build();

        // 5. Sign with Freighter
        const xdr = assembled.toXDR();
        const signResult = await freighterApi.signTransaction(xdr, {
            networkPassphrase: NETWORK_PASSPHRASE,
        });

        if (signResult?.error) {
            return { result: null, error: `Freighter signing error: ${signResult.error}` };
        }

        const signedXdr = signResult?.signedTxXdr ?? signResult;
        if (!signedXdr) {
            return { result: null, error: 'Freighter returned no signed XDR.' };
        }

        // 6. Submit
        const signed = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
        const sendResult = await server.sendTransaction(signed);

        if (sendResult.status === 'ERROR') {
            return { result: null, error: `Submission error: ${sendResult.errorResult?.toXDR('base64') ?? 'unknown'}` };
        }

        // 7. Poll until final status
        let getResult = await server.getTransaction(sendResult.hash);
        let attempts = 0;
        while (getResult.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 20) {
            await new Promise(r => setTimeout(r, 1500));
            getResult = await server.getTransaction(sendResult.hash);
            attempts++;
        }

        if (getResult.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
            return { result: getResult.returnValue ?? true, error: null };
        }

        return { result: null, error: `Transaction failed: ${getResult.status}` };
    } catch (err) {
        return { result: null, error: err.message };
    }
}

/**
 * Call a read-only (view/simulation-only) contract function.
 * Does NOT require a signed transaction or Freighter.
 *
 * @param {xdr.Operation} operation
 * @returns {Promise<{ result: any, error: string|null }>}
 */
async function viewContract(operation) {
    try {
        // Use a throwaway keypair for simulation account
        const keypair = StellarSdk.Keypair.random();
        const fakeAccount = new StellarSdk.Account(keypair.publicKey(), '0');

        const tx = new StellarSdk.TransactionBuilder(fakeAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        const simResult = await server.simulateTransaction(tx);

        if (StellarSdk.SorobanRpc.Api.isSimulationError(simResult)) {
            return { result: null, error: `Simulation failed: ${simResult.error}` };
        }

        return { result: simResult.result?.retval ?? null, error: null };
    } catch (err) {
        return { result: null, error: err.message };
    }
}

// ─── Helper: convert hex string to BytesN<32> ScVal ──────────────────────────
function hexToBytes32ScVal(hex) {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buf = Buffer.from(clean.padStart(64, '0').slice(0, 64), 'hex');
    return StellarSdk.xdr.ScVal.scvBytes(buf);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTRACT FUNCTION WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * anchor_evidence — Anchor a file's hash and metadata on-chain.
 *
 * This is the PRIMARY write function used by police officers / admins
 * when they upload evidence. Requires Freighter signature from `uploaderPublicKey`.
 *
 * @param {string} uploaderPublicKey  — Freighter-connected Stellar address (G...)
 * @param {string} evidenceId         — e.g. "EV-2024-001"
 * @param {string} fileName           — e.g. "FIR_Case_2024_Bangalore.pdf"
 * @param {string} sha256Hex          — 64-char hex SHA-256 of the file
 * @param {string} ipfsCid            — IPFS CID after pinning
 * @param {string} caseId             — e.g. "LCX-2024-1234"
 * @param {string} station            — e.g. "Koramangala PS"
 * @param {string} evidenceType       — e.g. "FIR" | "CCTV" | "Statement"
 * @returns {Promise<{ result: any, error: string|null }>}
 */
export async function anchorEvidence(
    uploaderPublicKey,
    evidenceId,
    fileName,
    sha256Hex,
    ipfsCid,
    caseId,
    station,
    evidenceType,
) {
    const contract = getContract();

    const operation = contract.call(
        'anchor_evidence',
        StellarSdk.nativeToScVal(uploaderPublicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(evidenceId,        { type: 'string' }),
        StellarSdk.nativeToScVal(fileName,           { type: 'string' }),
        hexToBytes32ScVal(sha256Hex),
        StellarSdk.nativeToScVal(ipfsCid,            { type: 'string' }),
        StellarSdk.nativeToScVal(caseId,             { type: 'string' }),
        StellarSdk.nativeToScVal(station,            { type: 'string' }),
        StellarSdk.nativeToScVal(evidenceType,       { type: 'string' }),
    );

    return invokeContract(uploaderPublicKey, operation);
}

/**
 * get_evidence — Read an evidence record by ID (no signature required).
 *
 * @param {string} evidenceId  — e.g. "EV-2024-001"
 * @returns {Promise<{ result: xdr.ScVal|null, error: string|null }>}
 */
export async function getEvidence(evidenceId) {
    const contract = getContract();
    const operation = contract.call(
        'get_evidence',
        StellarSdk.nativeToScVal(evidenceId, { type: 'string' }),
    );
    return viewContract(operation);
}

/**
 * verify_evidence — Check whether a stored hash matches the given hash (read-only).
 *
 * @param {string} evidenceId  — e.g. "EV-2024-001"
 * @param {string} sha256Hex   — 64-char hex SHA-256 to compare against
 * @returns {Promise<{ result: boolean|null, error: string|null }>}
 */
export async function verifyEvidence(evidenceId, sha256Hex) {
    const contract = getContract();
    const operation = contract.call(
        'verify_evidence',
        StellarSdk.nativeToScVal(evidenceId, { type: 'string' }),
        hexToBytes32ScVal(sha256Hex),
    );
    return viewContract(operation);
}

/**
 * find_by_hash — Look up an evidence ID by its SHA-256 hash (read-only).
 *
 * @param {string} sha256Hex — 64-char hex SHA-256
 * @returns {Promise<{ result: string|null, error: string|null }>}
 */
export async function findByHash(sha256Hex) {
    const contract = getContract();
    const operation = contract.call(
        'find_by_hash',
        hexToBytes32ScVal(sha256Hex),
    );
    return viewContract(operation);
}

/**
 * get_case_evidence — Return all evidence IDs associated with a case (read-only).
 *
 * @param {string} caseId — e.g. "LCX-2024-1234"
 * @returns {Promise<{ result: xdr.ScVal|null, error: string|null }>}
 */
export async function getCaseEvidence(caseId) {
    const contract = getContract();
    const operation = contract.call(
        'get_case_evidence',
        StellarSdk.nativeToScVal(caseId, { type: 'string' }),
    );
    return viewContract(operation);
}

/**
 * court_approval — Judge approves or rejects a piece of evidence (requires Freighter).
 *
 * @param {string}  judgePublicKey — Freighter-connected Stellar address of judge
 * @param {string}  evidenceId     — e.g. "EV-2024-001"
 * @param {boolean} approved       — true = Approved, false = Rejected
 * @returns {Promise<{ result: any, error: string|null }>}
 */
export async function courtApproval(judgePublicKey, evidenceId, approved) {
    const contract = getContract();
    const operation = contract.call(
        'court_approval',
        StellarSdk.nativeToScVal(judgePublicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(evidenceId,     { type: 'string' }),
        StellarSdk.nativeToScVal(approved,        { type: 'bool' }),
    );
    return invokeContract(judgePublicKey, operation);
}

/**
 * transfer_custody — Move evidence custody to a new holder (requires Freighter).
 *
 * @param {string} currentHolderPublicKey — Current holder's Stellar address
 * @param {string} evidenceId             — e.g. "EV-2024-001"
 * @param {string} newHolderPublicKey     — New holder's Stellar address
 * @param {string} reason                 — e.g. "Transferred to Forensic Lab"
 * @returns {Promise<{ result: any, error: string|null }>}
 */
export async function transferCustody(currentHolderPublicKey, evidenceId, newHolderPublicKey, reason) {
    const contract = getContract();
    const operation = contract.call(
        'transfer_custody',
        StellarSdk.nativeToScVal(currentHolderPublicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(evidenceId,             { type: 'string' }),
        StellarSdk.nativeToScVal(newHolderPublicKey,     { type: 'address' }),
        StellarSdk.nativeToScVal(reason,                 { type: 'string' }),
    );
    return invokeContract(currentHolderPublicKey, operation);
}

/**
 * total_evidence — Return total number of anchored evidence records (read-only).
 *
 * @returns {Promise<{ result: bigint|null, error: string|null }>}
 */
export async function totalEvidence() {
    const contract = getContract();
    const operation = contract.call('total_evidence');
    return viewContract(operation);
}

/**
 * get_admin — Return the contract admin address (read-only).
 *
 * @returns {Promise<{ result: xdr.ScVal|null, error: string|null }>}
 */
export async function getAdmin() {
    const contract = getContract();
    const operation = contract.call('get_admin');
    return viewContract(operation);
}

/**
 * version — Return contract version number (read-only).
 *
 * @returns {Promise<{ result: number|null, error: string|null }>}
 */
export async function contractVersion() {
    const contract = getContract();
    const operation = contract.call('version');
    return viewContract(operation);
}

/**
 * initialize — One-time contract initialization (admin only, requires Freighter).
 *
 * @param {string} adminPublicKey — Admin's Stellar address
 * @returns {Promise<{ result: any, error: string|null }>}
 */
export async function initializeContract(adminPublicKey) {
    const contract = getContract();
    const operation = contract.call(
        'initialize',
        StellarSdk.nativeToScVal(adminPublicKey, { type: 'address' }),
    );
    return invokeContract(adminPublicKey, operation);
}

/**
 * add_officer — Authorize a new officer address (admin only, requires Freighter).
 *
 * @param {string} adminPublicKey   — Admin's Stellar address (signer)
 * @param {string} officerPublicKey — Officer's Stellar address to authorize
 * @returns {Promise<{ result: any, error: string|null }>}
 */
export async function addOfficer(adminPublicKey, officerPublicKey) {
    const contract = getContract();
    const operation = contract.call(
        'add_officer',
        StellarSdk.nativeToScVal(officerPublicKey, { type: 'address' }),
    );
    return invokeContract(adminPublicKey, operation);
}

/**
 * add_judge — Authorize a new judge address (admin only, requires Freighter).
 *
 * @param {string} adminPublicKey  — Admin's Stellar address (signer)
 * @param {string} judgePublicKey  — Judge's Stellar address to authorize
 * @returns {Promise<{ result: any, error: string|null }>}
 */
export async function addJudge(adminPublicKey, judgePublicKey) {
    const contract = getContract();
    const operation = contract.call(
        'add_judge',
        StellarSdk.nativeToScVal(judgePublicKey, { type: 'address' }),
    );
    return invokeContract(adminPublicKey, operation);
}
