// Soroban Smart Contract for Escrow System
// This is a simplified example for the Starnance platform

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol, Vec, token
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Escrow(String), // jobId -> EscrowData
    EscrowsByEmployer(Address), // employer -> Vec<String>
    EscrowsByFreelancer(Address), // freelancer -> Vec<String>
}

#[derive(Clone)]
#[contracttype]
pub struct EscrowData {    pub job_id: String,
    pub employer: Address,
    pub freelancer: Option<Address>,
    pub amount: i128,
    pub token: Address, // XLM token contract
    pub status: EscrowStatus,
    pub created_at: u64,
    pub deadline: Option<u64>,
}

#[derive(Clone)]
#[contracttype]
pub enum EscrowStatus {
    Locked,
    Released,
    Cancelled,
    Disputed,
}

const ADMIN: Symbol = symbol_short!("ADMIN");

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the contract with admin
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&ADMIN, &admin);
    }

    /// Create a new escrow for a job
    /// Employer deposits funds that will be locked until job completion
    pub fn create_escrow(
        env: Env,
        job_id: String,
        employer: Address,
        amount: i128,
        token: Address,
        deadline: Option<u64>,
    ) -> Result<(), EscrowError> {
        // Verify employer authorization
        employer.require_auth();

        // Check if escrow already exists for this job
        let escrow_key = DataKey::Escrow(job_id.clone());
        if env.storage().temporary().has(&escrow_key) {
            return Err(EscrowError::EscrowAlreadyExists);
        }

        // Validate amount
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        // Transfer tokens from employer to contract
        let client = token::Client::new(&env, &token);
        client.transfer(&employer, &env.current_contract_address(), &amount);

        // Create escrow data
        let escrow = EscrowData {
            job_id: job_id.clone(),
            employer: employer.clone(),
            freelancer: None,
            amount,
            token,
            status: EscrowStatus::Locked,
            created_at: env.ledger().timestamp(),
            deadline,
        };

        // Store escrow data
        env.storage().temporary().set(&escrow_key, &escrow);

        // Update employer's escrow list
        let employer_key = DataKey::EscrowsByEmployer(employer.clone());
        let mut employer_escrows: Vec<String> = env.storage()
            .temporary()
            .get(&employer_key)
            .unwrap_or(Vec::new(&env));
        employer_escrows.push_back(job_id.clone());
        env.storage().temporary().set(&employer_key, &employer_escrows);

        // Emit event
        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("created")),
            (job_id, employer, amount),
        );

        Ok(())
    }

    /// Assign freelancer to an existing escrow
    pub fn assign_freelancer(
        env: Env,
        job_id: String,
        freelancer: Address,
    ) -> Result<(), EscrowError> {
        let escrow_key = DataKey::Escrow(job_id.clone());
        let mut escrow: EscrowData = env.storage()
            .temporary()
            .get(&escrow_key)
            .ok_or(EscrowError::EscrowNotFound)?;

        // Only employer can assign freelancer
        escrow.employer.require_auth();

        // Check if escrow is in correct state
        match escrow.status {
            EscrowStatus::Locked => {},
            _ => return Err(EscrowError::InvalidStatus),
        }

        // Assign freelancer
        escrow.freelancer = Some(freelancer.clone());
        env.storage().temporary().set(&escrow_key, &escrow);

        // Update freelancer's escrow list
        let freelancer_key = DataKey::EscrowsByFreelancer(freelancer.clone());
        let mut freelancer_escrows: Vec<String> = env.storage()
            .temporary()
            .get(&freelancer_key)
            .unwrap_or(Vec::new(&env));
        freelancer_escrows.push_back(job_id.clone());
        env.storage().temporary().set(&freelancer_key, &freelancer_escrows);

        // Emit event
        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("assigned")),
            (job_id, freelancer),
        );

        Ok(())
    }

    /// Release escrow funds to freelancer upon job completion approval
    pub fn release_escrow(
        env: Env,
        job_id: String,
    ) -> Result<(), EscrowError> {
        let escrow_key = DataKey::Escrow(job_id.clone());
        let mut escrow: EscrowData = env.storage()
            .temporary()
            .get(&escrow_key)
            .ok_or(EscrowError::EscrowNotFound)?;

        // Only employer can release funds
        escrow.employer.require_auth();

        // Check if escrow is in correct state
        match escrow.status {
            EscrowStatus::Locked => {},
            _ => return Err(EscrowError::InvalidStatus),
        }

        // Check if freelancer is assigned
        let freelancer = escrow.freelancer.ok_or(EscrowError::FreelancerNotAssigned)?;

        // Transfer tokens to freelancer
        let client = token::Client::new(&env, &escrow.token);
        client.transfer(&env.current_contract_address(), &freelancer, &escrow.amount);

        // Update escrow status
        escrow.status = EscrowStatus::Released;
        env.storage().temporary().set(&escrow_key, &escrow);

        // Emit event
        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("released")),
            (job_id, freelancer, escrow.amount),
        );

        Ok(())
    }

    /// Cancel escrow and refund to employer (only before freelancer assignment)
    pub fn cancel_escrow(
        env: Env,
        job_id: String,
    ) -> Result<(), EscrowError> {
        let escrow_key = DataKey::Escrow(job_id.clone());
        let mut escrow: EscrowData = env.storage()
            .temporary()
            .get(&escrow_key)
            .ok_or(EscrowError::EscrowNotFound)?;

        // Only employer can cancel
        escrow.employer.require_auth();

        // Check if escrow is in correct state
        match escrow.status {
            EscrowStatus::Locked => {},
            _ => return Err(EscrowError::InvalidStatus),
        }

        // Can only cancel if no freelancer assigned or if deadline passed
        if escrow.freelancer.is_some() {
            if let Some(deadline) = escrow.deadline {
                if env.ledger().timestamp() < deadline {
                    return Err(EscrowError::CannotCancel);
                }
            } else {
                return Err(EscrowError::CannotCancel);
            }
        }

        // Refund tokens to employer
        let client = token::Client::new(&env, &escrow.token);
        client.transfer(&env.current_contract_address(), &escrow.employer, &escrow.amount);

        // Update escrow status
        escrow.status = EscrowStatus::Cancelled;
        env.storage().temporary().set(&escrow_key, &escrow);

        // Emit event
        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("cancelled")),
            (job_id, escrow.employer, escrow.amount),
        );

        Ok(())
    }

    /// Initiate dispute (can be called by employer or freelancer)
    pub fn initiate_dispute(
        env: Env,
        job_id: String,
    ) -> Result<(), EscrowError> {
        let escrow_key = DataKey::Escrow(job_id.clone());
        let mut escrow: EscrowData = env.storage()
            .temporary()
            .get(&escrow_key)
            .ok_or(EscrowError::EscrowNotFound)?;

        // Check if escrow is in correct state
        match escrow.status {
            EscrowStatus::Locked => {},
            _ => return Err(EscrowError::InvalidStatus),
        }

        // Must have freelancer assigned
        let freelancer = escrow.freelancer.ok_or(EscrowError::FreelancerNotAssigned)?;

        // Either employer or freelancer can initiate dispute
        let invoker = env.current_contract_address(); // In practice, get from auth
        if invoker != escrow.employer && invoker != freelancer {
            return Err(EscrowError::Unauthorized);
        }

        // Update escrow status
        escrow.status = EscrowStatus::Disputed;
        env.storage().temporary().set(&escrow_key, &escrow);

        // Emit event
        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("disputed")),
            (job_id, invoker),
        );

        Ok(())
    }

    /// Resolve dispute (admin only)
    pub fn resolve_dispute(
        env: Env,
        job_id: String,
        resolution: DisputeResolution,
    ) -> Result<(), EscrowError> {
        // Only admin can resolve disputes
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let escrow_key = DataKey::Escrow(job_id.clone());
        let mut escrow: EscrowData = env.storage()
            .temporary()
            .get(&escrow_key)
            .ok_or(EscrowError::EscrowNotFound)?;

        // Check if escrow is in disputed state
        match escrow.status {
            EscrowStatus::Disputed => {},
            _ => return Err(EscrowError::InvalidStatus),
        }

        let freelancer = escrow.freelancer.ok_or(EscrowError::FreelancerNotAssigned)?;
        let client = token::Client::new(&env, &escrow.token);

        match resolution {
            DisputeResolution::FavorEmployer => {
                // Refund to employer
                client.transfer(&env.current_contract_address(), &escrow.employer, &escrow.amount);
                escrow.status = EscrowStatus::Cancelled;
            },
            DisputeResolution::FavorFreelancer => {
                // Pay freelancer
                client.transfer(&env.current_contract_address(), &freelancer, &escrow.amount);
                escrow.status = EscrowStatus::Released;
            },
            DisputeResolution::Split(employer_share) => {
                // Split between employer and freelancer
                let freelancer_share = escrow.amount - employer_share;
                if employer_share > 0 {
                    client.transfer(&env.current_contract_address(), &escrow.employer, &employer_share);
                }
                if freelancer_share > 0 {
                    client.transfer(&env.current_contract_address(), &freelancer, &freelancer_share);
                }
                escrow.status = EscrowStatus::Released;
            },
        }

        env.storage().temporary().set(&escrow_key, &escrow);

        // Emit event
        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("resolved")),
            (job_id, resolution),
        );

        Ok(())
    }

    /// Get escrow data for a job
    pub fn get_escrow(env: Env, job_id: String) -> Option<EscrowData> {
        let escrow_key = DataKey::Escrow(job_id);
        env.storage().temporary().get(&escrow_key)
    }

    /// Get all escrows for an employer
    pub fn get_employer_escrows(env: Env, employer: Address) -> Vec<String> {
        let employer_key = DataKey::EscrowsByEmployer(employer);
        env.storage().temporary().get(&employer_key).unwrap_or(Vec::new(&env))
    }

    /// Get all escrows for a freelancer
    pub fn get_freelancer_escrows(env: Env, freelancer: Address) -> Vec<String> {
        let freelancer_key = DataKey::EscrowsByFreelancer(freelancer);
        env.storage().temporary().get(&freelancer_key).unwrap_or(Vec::new(&env))
    }
}

#[derive(Clone)]
#[contracttype]
pub enum DisputeResolution {
    FavorEmployer,
    FavorFreelancer,
    Split(i128), // Amount to employer, rest to freelancer
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum EscrowError {
    EscrowAlreadyExists = 1,
    EscrowNotFound = 2,
    InvalidAmount = 3,
    InvalidStatus = 4,
    FreelancerNotAssigned = 5,
    CannotCancel = 6,
    Unauthorized = 7,
    InsufficientBalance = 8,
}
