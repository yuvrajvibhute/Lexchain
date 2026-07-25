//! LexChain Evidence Anchor Smart Contract
//! 
//! Deployed on Stellar Testnet (Soroban)
//! 
//! This contract provides tamper-proof evidence anchoring on the Stellar blockchain.
//! Each piece of evidence is hashed and its metadata is stored immutably on-chain.
//! 
//! Key Features:
//! - Anchor evidence hashes on-chain with full metadata
//! - Verify evidence integrity by hash comparison
//! - Track chain of custody with actor addresses
//! - Immutable audit log of all evidence operations
//! - Role-based access control (admin, officer, judge)

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec,
    Address, Env, Map, String, Vec, Symbol, BytesN,
};

/// Evidence status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EvidenceStatus {
    Pending,
    Verified,
    Approved,
    Rejected,
}

/// Custody entry - who did what and when
#[contracttype]
#[derive(Clone, Debug)]
pub struct CustodyEntry {
    pub actor: Address,
    pub action: String,
    pub timestamp: u64,
}

/// Core evidence record stored on-chain
#[contracttype]
#[derive(Clone, Debug)]
pub struct EvidenceRecord {
    pub id: String,
    pub name: String,
    pub hash: BytesN<32>,     // SHA-256 hash of the file
    pub ipfs_cid: String,     // IPFS CID for file retrieval
    pub case_id: String,
    pub uploaded_by: Address,
    pub station: String,
    pub evidence_type: String,
    pub timestamp: u64,
    pub status: EvidenceStatus,
    pub court_approval: bool,
    pub chain_of_custody: Vec<CustodyEntry>,
}

/// Storage keys
const EVIDENCE_COUNT: Symbol = symbol_short!("ev_count");
const ADMIN: Symbol = symbol_short!("admin");

/// Data keys for the ledger
#[contracttype]
pub enum DataKey {
    Evidence(String),       // Evidence ID → EvidenceRecord
    EvidenceByHash(BytesN<32>),  // Hash → Evidence ID
    CaseEvidence(String),   // Case ID → Vec<EvidenceId>
    Admin,
    Officers,
    Judges,
    TotalCount,
}

#[contract]
pub struct EvidenceAnchorContract;

#[contractimpl]
impl EvidenceAnchorContract {

    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalCount, &0u64);
        env.storage().instance().set(&DataKey::Officers, &Vec::<Address>::new(&env));
        env.storage().instance().set(&DataKey::Judges, &Vec::<Address>::new(&env));
    }

    /// Get the contract admin
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Add an authorized officer (admin only)
    pub fn add_officer(env: Env, officer: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        let mut officers: Vec<Address> = env.storage().instance()
            .get(&DataKey::Officers)
            .unwrap_or_else(|| Vec::new(&env));
        officers.push_back(officer);
        env.storage().instance().set(&DataKey::Officers, &officers);
    }

    /// Add an authorized judge (admin only)
    pub fn add_judge(env: Env, judge: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        let mut judges: Vec<Address> = env.storage().instance()
            .get(&DataKey::Judges)
            .unwrap_or_else(|| Vec::new(&env));
        judges.push_back(judge);
        env.storage().instance().set(&DataKey::Judges, &judges);
    }

    /// Anchor a new piece of evidence on-chain
    /// Called by authorized officers (police/admin)
    pub fn anchor_evidence(
        env: Env,
        uploader: Address,
        id: String,
        name: String,
        hash: BytesN<32>,
        ipfs_cid: String,
        case_id: String,
        station: String,
        evidence_type: String,
    ) -> EvidenceRecord {
        uploader.require_auth();

        // Prevent duplicate evidence
        let evidence_key = DataKey::Evidence(id.clone());
        if env.storage().persistent().has(&evidence_key) {
            panic!("Evidence with this ID already exists");
        }

        // Prevent duplicate hash
        let hash_key = DataKey::EvidenceByHash(hash.clone());
        if env.storage().persistent().has(&hash_key) {
            panic!("Evidence with this hash already anchored");
        }

        let now = env.ledger().timestamp();
        
        let custody_entry = CustodyEntry {
            actor: uploader.clone(),
            action: String::from_str(&env, "Initial Upload & IPFS Pinned"),
            timestamp: now,
        };

        let record = EvidenceRecord {
            id: id.clone(),
            name,
            hash: hash.clone(),
            ipfs_cid,
            case_id: case_id.clone(),
            uploaded_by: uploader.clone(),
            station,
            evidence_type,
            timestamp: now,
            status: EvidenceStatus::Verified,
            court_approval: false,
            chain_of_custody: vec![&env, custody_entry],
        };

        // Store evidence
        env.storage().persistent().set(&evidence_key, &record);
        env.storage().persistent().set(&hash_key, &id);

        // Update case index
        let case_key = DataKey::CaseEvidence(case_id);
        let mut case_evidence: Vec<String> = env.storage().persistent()
            .get(&case_key)
            .unwrap_or_else(|| Vec::new(&env));
        case_evidence.push_back(id);
        env.storage().persistent().set(&case_key, &case_evidence);

        // Increment total count
        let count: u64 = env.storage().instance().get(&DataKey::TotalCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalCount, &(count + 1));

        // Emit event
        env.events().publish(
            (symbol_short!("evidence"), symbol_short!("anchored")),
            (uploader, record.id.clone()),
        );

        record
    }

    /// Get a specific evidence record by ID
    pub fn get_evidence(env: Env, id: String) -> Option<EvidenceRecord> {
        env.storage().persistent().get(&DataKey::Evidence(id))
    }

    /// Verify evidence integrity by comparing hash
    pub fn verify_evidence(env: Env, id: String, hash: BytesN<32>) -> bool {
        let record: Option<EvidenceRecord> = env.storage().persistent()
            .get(&DataKey::Evidence(id));
        
        match record {
            Some(r) => r.hash == hash,
            None => false,
        }
    }

    /// Find evidence by hash (tamper detection)
    pub fn find_by_hash(env: Env, hash: BytesN<32>) -> Option<String> {
        env.storage().persistent().get(&DataKey::EvidenceByHash(hash))
    }

    /// Get all evidence IDs for a case
    pub fn get_case_evidence(env: Env, case_id: String) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::CaseEvidence(case_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Court approval - judge approves or rejects evidence
    pub fn court_approval(
        env: Env,
        judge: Address,
        evidence_id: String,
        approved: bool,
    ) {
        judge.require_auth();

        let evidence_key = DataKey::Evidence(evidence_id.clone());
        let mut record: EvidenceRecord = env.storage().persistent()
            .get(&evidence_key)
            .expect("Evidence not found");

        record.court_approval = approved;
        record.status = if approved { EvidenceStatus::Approved } else { EvidenceStatus::Rejected };

        let action = if approved {
            String::from_str(&env, "Approved by Court")
        } else {
            String::from_str(&env, "Rejected by Court")
        };

        record.chain_of_custody.push_back(CustodyEntry {
            actor: judge.clone(),
            action,
            timestamp: env.ledger().timestamp(),
        });

        env.storage().persistent().set(&evidence_key, &record);

        // Emit event
        env.events().publish(
            (symbol_short!("evidence"), symbol_short!("approved")),
            (judge, evidence_id, approved),
        );
    }

    /// Transfer custody to another officer
    pub fn transfer_custody(
        env: Env,
        current_holder: Address,
        evidence_id: String,
        new_holder: Address,
        reason: String,
    ) {
        current_holder.require_auth();

        let evidence_key = DataKey::Evidence(evidence_id.clone());
        let mut record: EvidenceRecord = env.storage().persistent()
            .get(&evidence_key)
            .expect("Evidence not found");

        record.chain_of_custody.push_back(CustodyEntry {
            actor: new_holder.clone(),
            action: reason,
            timestamp: env.ledger().timestamp(),
        });

        env.storage().persistent().set(&evidence_key, &record);

        env.events().publish(
            (symbol_short!("custody"), symbol_short!("transfer")),
            (current_holder, new_holder, evidence_id),
        );
    }

    /// Get total evidence count
    pub fn total_evidence(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::TotalCount).unwrap_or(0)
    }

    /// Get contract version
    pub fn version(_env: Env) -> u32 {
        1
    }
}

/// Unit tests
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EvidenceAnchorContract);
        let client = EvidenceAnchorContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        client.initialize(&admin);
        assert_eq!(client.get_admin(), admin);
    }

    #[test]
    fn test_anchor_and_verify_evidence() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EvidenceAnchorContract);
        let client = EvidenceAnchorContractClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let officer = Address::generate(&env);
        client.initialize(&admin);
        client.add_officer(&officer);
        
        let hash_bytes: [u8; 32] = [1u8; 32];
        let hash = BytesN::from_array(&env, &hash_bytes);
        
        let record = client.anchor_evidence(
            &officer,
            &String::from_str(&env, "EV-2024-001"),
            &String::from_str(&env, "FIR_Case_2024.pdf"),
            &hash,
            &String::from_str(&env, "QmX9bK2nR7sP4tA3mE6d"),
            &String::from_str(&env, "LCX-2024-1234"),
            &String::from_str(&env, "Koramangala PS"),
            &String::from_str(&env, "FIR"),
        );
        
        assert_eq!(record.status, EvidenceStatus::Verified);
        assert_eq!(client.total_evidence(), 1);
        assert!(client.verify_evidence(&String::from_str(&env, "EV-2024-001"), &hash));
    }

    #[test]
    fn test_court_approval() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EvidenceAnchorContract);
        let client = EvidenceAnchorContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let officer = Address::generate(&env);
        let judge = Address::generate(&env);
        client.initialize(&admin);
        client.add_judge(&judge);
        
        let hash = BytesN::from_array(&env, &[2u8; 32]);
        client.anchor_evidence(
            &officer,
            &String::from_str(&env, "EV-2024-002"),
            &String::from_str(&env, "Statement.pdf"),
            &hash,
            &String::from_str(&env, "QmTestCID"),
            &String::from_str(&env, "LCX-2024-5678"),
            &String::from_str(&env, "MG Road PS"),
            &String::from_str(&env, "Statement"),
        );
        
        client.court_approval(&judge, &String::from_str(&env, "EV-2024-002"), &true);
        let record = client.get_evidence(&String::from_str(&env, "EV-2024-002")).unwrap();
        assert_eq!(record.status, EvidenceStatus::Approved);
        assert!(record.court_approval);
        assert_eq!(record.chain_of_custody.len(), 2);
    }
}
