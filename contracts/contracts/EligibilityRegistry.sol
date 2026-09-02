// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title EligibilityRegistry
/// @notice Telangana MeeSeva-inspired decentralized certificate registry.
///         Enforces 3-tier revenue administration:
///         Citizen Submission -> VRO Field Verification -> RI Endorsement -> Tahsildar Digital Issuance.
///         Stores cryptographic document hashes and validity periods without exposing citizen PII on-chain.
contract EligibilityRegistry is AccessControl, Pausable {
    bytes32 public constant VRO_ROLE = keccak256("VRO_ROLE");
    bytes32 public constant RI_ROLE = keccak256("RI_ROLE");
    bytes32 public constant TAHSILDAR_ROLE = keccak256("TAHSILDAR_ROLE");

    enum Stage {
        None,           // 0
        Submitted,      // 1: Pending VRO Field Verification
        VRO_Verified,   // 2: Verified by VRO, pending RI Endorsement
        RI_Endorsed,    // 3: Endorsed by RI, pending Tahsildar Issuance
        Issued,         // 4: Digitally Approved & Issued by Tahsildar
        Rejected,       // 5: Rejected at any stage with remarks
        Revoked         // 6: Cancelled post-issuance (e.g. Scrutiny Committee)
    }

    struct Application {
        string applicationId;   // e.g. "TS-CGC-2026-0001"
        address beneficiary;    // Citizen wallet address
        uint8 category;         // 1: Caste, 2: Income, 3: Residence, 4: EWS
        bytes32 documentHash;   // Keccak-256 / IPFS hash of application bundle & proofs
        Stage stage;
        uint256 submittedAt;
        uint256 decidedAt;
        uint256 validUntil;     // 0 = Lifetime (e.g. Caste), >0 = Expiry timestamp
        address vro;
        address ri;
        address tahsildar;
        string remarks;
    }

    mapping(string => Application) private applications;
    mapping(address => string[]) private beneficiaryApplications;
    string[] private allApplicationIds;

    // Events
    event ApplicationSubmitted(string indexed applicationId, address indexed beneficiary, uint8 category, bytes32 documentHash);
    event VROVerified(string indexed applicationId, address indexed vro, bool approved, string remarks);
    event RIEndorsed(string indexed applicationId, address indexed ri, bool approved, string remarks);
    event CertificateIssued(string indexed applicationId, address indexed tahsildar, uint256 validUntil, string remarks);
    event ApplicationRejected(string indexed applicationId, address indexed officer, uint8 stageAtRejection, string remarks);
    event CertificateRevoked(string indexed applicationId, address indexed officer, string reason);
    event OfficerRoleUpdated(bytes32 indexed role, address indexed officer, bool granted);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TAHSILDAR_ROLE, admin);
        _grantRole(RI_ROLE, admin);
        _grantRole(VRO_ROLE, admin);
    }

    // ---------- Role & Admin Controls ----------

    function addOfficer(bytes32 role, address officer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(role, officer);
        emit OfficerRoleUpdated(role, officer, true);
    }

    function removeOfficer(bytes32 role, address officer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(role, officer);
        emit OfficerRoleUpdated(role, officer, false);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ---------- Citizen Submission ----------

    /// @notice Citizen submits a new certificate application with a unique MeeSeva Application ID.
    function submitApplication(
        string calldata applicationId,
        uint8 category,
        bytes32 documentHash,
        uint256 validUntil
    ) external whenNotPaused {
        require(bytes(applicationId).length > 0, "Application ID required");
        require(documentHash != bytes32(0), "Invalid document hash");
        require(category >= 1 && category <= 4, "Invalid category");
        require(applications[applicationId].stage == Stage.None, "Application ID already exists");

        Application storage app = applications[applicationId];
        app.applicationId = applicationId;
        app.beneficiary = msg.sender;
        app.category = category;
        app.documentHash = documentHash;
        app.stage = Stage.Submitted;
        app.submittedAt = block.timestamp;
        app.validUntil = validUntil;

        beneficiaryApplications[msg.sender].push(applicationId);
        allApplicationIds.push(applicationId);

        emit ApplicationSubmitted(applicationId, msg.sender, category, documentHash);
    }

    // ---------- Stage 1: VRO Field Verification ----------

    function verifyByVRO(
        string calldata applicationId,
        bool approve,
        string calldata remarks
    ) external onlyRole(VRO_ROLE) whenNotPaused {
        Application storage app = applications[applicationId];
        require(app.stage == Stage.Submitted, "Not in Submitted stage");

        app.vro = msg.sender;
        app.remarks = remarks;

        if (approve) {
            app.stage = Stage.VRO_Verified;
            emit VROVerified(applicationId, msg.sender, true, remarks);
        } else {
            app.stage = Stage.Rejected;
            app.decidedAt = block.timestamp;
            emit ApplicationRejected(applicationId, msg.sender, uint8(Stage.Submitted), remarks);
        }
    }

    // ---------- Stage 2: RI Endorsement ----------

    function endorseByRI(
        string calldata applicationId,
        bool approve,
        string calldata remarks
    ) external onlyRole(RI_ROLE) whenNotPaused {
        Application storage app = applications[applicationId];
        require(app.stage == Stage.VRO_Verified, "Not verified by VRO");

        app.ri = msg.sender;
        app.remarks = remarks;

        if (approve) {
            app.stage = Stage.RI_Endorsed;
            emit RIEndorsed(applicationId, msg.sender, true, remarks);
        } else {
            app.stage = Stage.Rejected;
            app.decidedAt = block.timestamp;
            emit ApplicationRejected(applicationId, msg.sender, uint8(Stage.VRO_Verified), remarks);
        }
    }

    // ---------- Stage 3: Tahsildar / MRO Digital Issuance ----------

    function issueByTahsildar(
        string calldata applicationId,
        bool approve,
        string calldata remarks
    ) external onlyRole(TAHSILDAR_ROLE) whenNotPaused {
        Application storage app = applications[applicationId];
        require(app.stage == Stage.RI_Endorsed, "Not endorsed by RI");

        app.tahsildar = msg.sender;
        app.remarks = remarks;
        app.decidedAt = block.timestamp;

        if (approve) {
            app.stage = Stage.Issued;
            emit CertificateIssued(applicationId, msg.sender, app.validUntil, remarks);
        } else {
            app.stage = Stage.Rejected;
            emit ApplicationRejected(applicationId, msg.sender, uint8(Stage.RI_Endorsed), remarks);
        }
    }

    // ---------- Revocation ----------

    function revokeCertificate(
        string calldata applicationId,
        string calldata reason
    ) external whenNotPaused {
        require(
            hasRole(TAHSILDAR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller cannot revoke"
        );
        Application storage app = applications[applicationId];
        require(app.stage == Stage.Issued, "Certificate is not in Issued state");

        app.stage = Stage.Revoked;
        app.remarks = reason;

        emit CertificateRevoked(applicationId, msg.sender, reason);
    }

    // ---------- Query Views ----------

    function getApplication(string calldata applicationId) external view returns (Application memory) {
        require(applications[applicationId].stage != Stage.None, "Application not found");
        return applications[applicationId];
    }

    function getBeneficiaryApplications(address beneficiary) external view returns (string[] memory) {
        return beneficiaryApplications[beneficiary];
    }

    function getAllApplicationIds() external view returns (string[] memory) {
        return allApplicationIds;
    }

    function totalApplications() external view returns (uint256) {
        return allApplicationIds.length;
    }

    /// @notice Verifies if a specific certificate is issued and currently valid.
    function isCertificateValid(string calldata applicationId) external view returns (bool) {
        Application memory app = applications[applicationId];
        if (app.stage != Stage.Issued) return false;
        if (app.validUntil != 0 && block.timestamp > app.validUntil) return false;
        return true;
    }

    /// @notice Verifies if a beneficiary has at least one valid, non-expired certificate of a given category.
    function isBeneficiaryEligible(address beneficiary, uint8 category) external view returns (bool) {
        string[] memory appIds = beneficiaryApplications[beneficiary];
        for (uint256 i = 0; i < appIds.length; i++) {
            Application memory app = applications[appIds[i]];
            if (app.category == category && app.stage == Stage.Issued) {
                if (app.validUntil == 0 || block.timestamp <= app.validUntil) {
                    return true;
                }
            }
        }
        return false;
    }
}
