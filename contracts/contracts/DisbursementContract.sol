// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EligibilityRegistry.sol";

/// @title DisbursementContract
/// @notice Pays out an ERC-20 token (e.g. a stablecoin) to beneficiaries
///         who are marked eligible in the EligibilityRegistry. Enforces
///         a minimum interval between payouts per beneficiary.
contract DisbursementContract is AccessControl, Pausable {
    bytes32 public constant DISBURSER_ROLE = keccak256("DISBURSER_ROLE");

    EligibilityRegistry public immutable eligibilityRegistry;
    IERC20 public immutable payoutToken;

    uint256 public disbursementInterval = 30 days;
    uint256 public disbursementAmount;

    mapping(address => uint256) public lastDisbursement;
    mapping(address => uint256) public totalDisbursed;

    event Disbursed(address indexed beneficiary, uint256 amount);
    event ParametersUpdated(uint256 interval, uint256 amount);

    constructor(
        address admin,
        address _eligibilityRegistry,
        address _payoutToken,
        uint256 _disbursementAmount
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISBURSER_ROLE, admin);
        eligibilityRegistry = EligibilityRegistry(_eligibilityRegistry);
        payoutToken = IERC20(_payoutToken);
        disbursementAmount = _disbursementAmount;
    }

    function setParameters(uint256 interval, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        disbursementInterval = interval;
        disbursementAmount = amount;
        emit ParametersUpdated(interval, amount);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    /// @notice Triggered by an admin, a keeper bot, or the backend scheduler.
    function disburse(address beneficiary) external onlyRole(DISBURSER_ROLE) whenNotPaused {
        require(eligibilityRegistry.isEligible(beneficiary), "Not eligible");
        require(
            block.timestamp >= lastDisbursement[beneficiary] + disbursementInterval,
            "Too soon since last disbursement"
        );

        lastDisbursement[beneficiary] = block.timestamp;
        totalDisbursed[beneficiary] += disbursementAmount;

        require(payoutToken.transfer(beneficiary, disbursementAmount), "Transfer failed");

        emit Disbursed(beneficiary, disbursementAmount);
    }

    /// @notice Admin can top up the contract's token balance by transferring
    ///         tokens directly to this contract address before calling disburse.
    function contractBalance() external view returns (uint256) {
        return payoutToken.balanceOf(address(this));
    }
}
