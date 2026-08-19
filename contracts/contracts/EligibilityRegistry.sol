// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title EligibilityRegistry
/// @notice Records verifier-attested eligibility claims. Stores ONLY a
///         category code, a status, and a hash pointer to off-chain
///         (IPFS) evidence. No personal data is ever written on-chain.
contract EligibilityRegistry is AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum ClaimStatus { None, Pending, Approved, Rejected }

    struct Claim {
        bytes32 documentHash;   // IPFS CID (hashed/encoded), not raw data
        uint8 category;         // eligibility category code, app-defined
        ClaimStatus status;
        address verifiedBy;
        uint256 submittedAt;
        uint256 decidedAt;
    }

    mapping(address => Claim) private claims;

    event ClaimSubmitted(address indexed beneficiary, uint8 category, bytes32 documentHash);
    event ClaimReviewed(address indexed beneficiary, address indexed verifier, bool approved);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------- Admin ----------

    function addVerifier(address verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, verifier);
        emit VerifierAdded(verifier);
    }

    function removeVerifier(address verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, verifier);
        emit VerifierRemoved(verifier);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ---------- Beneficiary ----------

    /// @notice Beneficiary (or backend on their behalf) submits a claim.
    /// @param documentHash Hash/CID pointer to off-chain evidence (e.g. IPFS).
    /// @param category App-defined eligibility category code.
    function submitClaim(bytes32 documentHash, uint8 category) external whenNotPaused {
        Claim storage c = claims[msg.sender];
        require(c.status != ClaimStatus.Approved, "Already approved");

        c.documentHash = documentHash;
        c.category = category;
        c.status = ClaimStatus.Pending;
        c.submittedAt = block.timestamp;
        c.decidedAt = 0;
        c.verifiedBy = address(0);

        emit ClaimSubmitted(msg.sender, category, documentHash);
    }

    // ---------- Verifier ----------

    /// @notice Verifier (or automated KYC webhook, via verifier role) approves/rejects.
    function reviewClaim(address beneficiary, bool approve) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        Claim storage c = claims[beneficiary];
        require(c.status == ClaimStatus.Pending, "No pending claim");

        c.status = approve ? ClaimStatus.Approved : ClaimStatus.Rejected;
        c.verifiedBy = msg.sender;
        c.decidedAt = block.timestamp;

        emit ClaimReviewed(beneficiary, msg.sender, approve);
    }

    // ---------- Views ----------

    function isEligible(address beneficiary) external view returns (bool) {
        return claims[beneficiary].status == ClaimStatus.Approved;
    }

    function getClaim(address beneficiary) external view returns (Claim memory) {
        return claims[beneficiary];
    }
}
