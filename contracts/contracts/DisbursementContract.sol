// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EligibilityRegistry.sol";

/// @title DisbursementContract
/// @notice Direct Benefit Transfer (DBT) simulator for Telangana welfare schemes
///         (e.g., ePASS Scholarships, Rythu Bharosa Grants).
///         PAYS tokens only to beneficiaries possessing verified, non-expired MeeSeva certificates.
contract DisbursementContract is AccessControl, Pausable {
    bytes32 public constant DISBURSER_ROLE = keccak256("DISBURSER_ROLE");

    struct Scheme {
        string name;
        uint8 requiredCategory; // 1: Caste, 2: Income, 3: Residence, 4: EWS
        uint256 payoutAmount;
        uint256 interval;       // Cooldown between payouts in seconds
        bool active;
    }

    EligibilityRegistry public immutable eligibilityRegistry;
    IERC20 public immutable payoutToken;

    mapping(uint256 => Scheme) public schemes;
    uint256 public schemeCount;

    // beneficiary => schemeId => timestamp of last payout
    mapping(address => mapping(uint256 => uint256)) public lastDisbursement;
    // beneficiary => schemeId => total tokens received
    mapping(address => mapping(uint256 => uint256)) public totalDisbursed;

    event SchemeAdded(uint256 indexed schemeId, string name, uint8 requiredCategory, uint256 payoutAmount, uint256 interval);
    event Disbursed(address indexed beneficiary, uint256 indexed schemeId, uint256 amount);

    constructor(
        address admin,
        address _eligibilityRegistry,
        address _payoutToken
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISBURSER_ROLE, admin);
        eligibilityRegistry = EligibilityRegistry(_eligibilityRegistry);
        payoutToken = IERC20(_payoutToken);

        // Add Scheme 1: ePASS Post-Matric Scholarship (Caste / Income based)
        _addScheme("Telangana ePASS Post-Matric Scholarship", 1, 250 * 10**18, 30 days);

        // Add Scheme 2: Rythu Bharosa / Income Welfare Grant
        _addScheme("Telangana Welfare & Livelihood Grant", 2, 500 * 10**18, 60 days);
    }

    function _addScheme(string memory name, uint8 requiredCategory, uint256 payoutAmount, uint256 interval) internal {
        schemeCount++;
        schemes[schemeCount] = Scheme({
            name: name,
            requiredCategory: requiredCategory,
            payoutAmount: payoutAmount,
            interval: interval,
            active: true
        });
        emit SchemeAdded(schemeCount, name, requiredCategory, payoutAmount, interval);
    }

    function addScheme(string memory name, uint8 requiredCategory, uint256 payoutAmount, uint256 interval) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addScheme(name, requiredCategory, payoutAmount, interval);
    }

    function setSchemeStatus(uint256 schemeId, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(schemeId > 0 && schemeId <= schemeCount, "Invalid scheme ID");
        schemes[schemeId].active = active;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    /// @notice Self-service claim: Beneficiary claims their own DBT entitlement.
    function claimDisbursement(uint256 schemeId) external whenNotPaused {
        _processDisbursement(msg.sender, schemeId);
    }

    /// @notice Officer/Keeper pushed: Triggered by welfare department on behalf of citizen.
    function disburse(address beneficiary, uint256 schemeId) external onlyRole(DISBURSER_ROLE) whenNotPaused {
        _processDisbursement(beneficiary, schemeId);
    }

    function _processDisbursement(address beneficiary, uint256 schemeId) internal {
        require(schemeId > 0 && schemeId <= schemeCount, "Invalid scheme ID");
        Scheme memory scheme = schemes[schemeId];
        require(scheme.active, "Scheme is not active");

        // Verify beneficiary holds a valid on-chain certificate in the required category
        require(
            eligibilityRegistry.isBeneficiaryEligible(beneficiary, scheme.requiredCategory),
            "Beneficiary does not possess a valid required MeeSeva certificate"
        );

        require(
            block.timestamp >= lastDisbursement[beneficiary][schemeId] + scheme.interval,
            "Disbursement interval cooldown active"
        );

        require(
            payoutToken.balanceOf(address(this)) >= scheme.payoutAmount,
            "Contract has insufficient token reserves"
        );

        lastDisbursement[beneficiary][schemeId] = block.timestamp;
        totalDisbursed[beneficiary][schemeId] += scheme.payoutAmount;

        require(payoutToken.transfer(beneficiary, scheme.payoutAmount), "Token transfer failed");

        emit Disbursed(beneficiary, schemeId, scheme.payoutAmount);
    }

    function canClaim(address beneficiary, uint256 schemeId) external view returns (bool eligible, string memory reason) {
        if (schemeId == 0 || schemeId > schemeCount) return (false, "Invalid scheme ID");
        Scheme memory scheme = schemes[schemeId];
        if (!scheme.active) return (false, "Scheme not active");
        if (!eligibilityRegistry.isBeneficiaryEligible(beneficiary, scheme.requiredCategory)) {
            return (false, "Missing valid required MeeSeva certificate");
        }
        if (block.timestamp < lastDisbursement[beneficiary][schemeId] + scheme.interval) {
            return (false, "Interval cooldown active");
        }
        if (payoutToken.balanceOf(address(this)) < scheme.payoutAmount) {
            return (false, "Insufficient contract reserves");
        }
        return (true, "Eligible to claim");
    }

    function contractBalance() external view returns (uint256) {
        return payoutToken.balanceOf(address(this));
    }
}
