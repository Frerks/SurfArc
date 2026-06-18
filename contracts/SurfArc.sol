// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title SurfArc - On-chain surf spot report micropayments
contract SurfArc {
    IERC20 public immutable usdc;
    uint256 public constant REPORT_PRICE = 50_000; // $0.05 with 6 decimals
    uint256 public constant REPORT_TTL = 2 hours;
    uint256 public constant MIN_REPORTER_SHARE = 1_000; // $0.001
    address public owner;

    struct Report {
        address reporter;
        string spotId;
        string dataHash;   // IPFS hash or short descriptor
        uint8 waveHeight;  // in decimeters
        uint8 windKnots;
        uint8 swellPeriod; // seconds
        uint32 timestamp;
        uint32 score;      // validator score 0-100
    }

    struct ReporterStats {
        uint256 totalReports;
        uint256 totalEarned;
        uint256 lastReport;
    }

    mapping(string => Report) public latestReport;       // spotId => latest report
    mapping(address => ReporterStats) public reporters;
    mapping(string => address[]) public spotReporters;   // spotId => reporter list
    
    uint256 public totalReports;
    uint256 public totalPaid;

    event ReportSubmitted(string indexed spotId, address indexed reporter, uint256 timestamp);
    event ReportPurchased(string indexed spotId, address indexed buyer, uint256 paid);
    event ReporterPaid(address indexed reporter, uint256 amount);

    error InvalidSpot();
    error ReportExpired();
    error PaymentFailed();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    /// @notice Reporter submits spot conditions
    function submitReport(
        string calldata spotId,
        string calldata dataHash,
        uint8 waveHeight,
        uint8 windKnots,
        uint8 swellPeriod
    ) external {
        if (bytes(spotId).length == 0) revert InvalidSpot();

        Report storage r = latestReport[spotId];
        if (r.reporter == address(0)) {
            spotReporters[spotId].push(msg.sender);
        }

        r.reporter = msg.sender;
        r.spotId = spotId;
        r.dataHash = dataHash;
        r.waveHeight = waveHeight;
        r.windKnots = windKnots;
        r.swellPeriod = swellPeriod;
        r.timestamp = uint32(block.timestamp);
        r.score = 80; // default score, updatable by validator

        reporters[msg.sender].totalReports++;
        reporters[msg.sender].lastReport = block.timestamp;
        totalReports++;

        emit ReportSubmitted(spotId, msg.sender, block.timestamp);
    }

    /// @notice Buyer pays $0.05 USDC to get latest report
    function buyReport(string calldata spotId) external {
        Report storage r = latestReport[spotId];
        if (r.reporter == address(0)) revert InvalidSpot();
        if (block.timestamp > r.timestamp + REPORT_TTL) revert ReportExpired();

        bool ok = usdc.transferFrom(msg.sender, address(this), REPORT_PRICE);
        if (!ok) revert PaymentFailed();

        // Pay reporter
        uint256 reporterShare = (REPORT_PRICE * 80) / 100; // 80% to reporter
        usdc.transfer(r.reporter, reporterShare);
        reporters[r.reporter].totalEarned += reporterShare;
        totalPaid += reporterShare;

        emit ReportPurchased(spotId, msg.sender, REPORT_PRICE);
        emit ReporterPaid(r.reporter, reporterShare);
    }

    /// @notice Update validator score for a report
    function updateScore(string calldata spotId, uint32 score) external onlyOwner {
        latestReport[spotId].score = score;
    }

    /// @notice Withdraw protocol fees (20% remainder)
    function withdrawFees(address to) external onlyOwner {
        uint256 bal = _usdcBalance();
        if (bal > 0) usdc.transfer(to, bal);
    }

    function getReport(string calldata spotId) external view returns (Report memory) {
        return latestReport[spotId];
    }

    function isReportFresh(string calldata spotId) external view returns (bool) {
        Report storage r = latestReport[spotId];
        return r.reporter != address(0) && block.timestamp <= r.timestamp + REPORT_TTL;
    }

    function _usdcBalance() internal view returns (uint256) {
        // minimal balance check without full ERC20 interface
        (bool ok, bytes memory data) = address(usdc).staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        if (ok && data.length == 32) return abi.decode(data, (uint256));
        return 0;
    }
}
