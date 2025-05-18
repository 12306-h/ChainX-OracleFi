// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/**
 * @title InvestmentAdvisor
 * @dev Smart contract for storing investment advice and proofs
 */
contract InvestmentAdvisor {
    // Admin addresses
    address public owner;
    address public advisorServer;
    
    // Structure to store user requests
    struct RequestRecord {
        bytes32[] requestHashes;
        string[] cids;
        uint256[] timestamps;
    }
    
    // 将 public 改为 internal，并提供自定义 getter 函数
    mapping(address => RequestRecord) internal _userRequests;
    
    // Events
    event RequestRecorded(
        address indexed user,
        bytes32 requestHash,
        string cid,
        uint256 timestamp
    );
    
    // Modifier: only owner can call
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Modifier: only authorized advisor server can call
    modifier onlyAdvisor() {
        require(msg.sender == advisorServer, "Only authorized advisor can call this function");
        _;
    }
    
    /**
     * @dev Initialize contract
     */
    constructor() {
        owner = msg.sender;
        advisorServer = msg.sender; // Initially owner is also the advisor server
    }
    
    /**
     * @dev Change advisor server address
     * @param _newAdvisor New advisor server address
     */
    function setAdvisorServer(address _newAdvisor) external onlyOwner {
        advisorServer = _newAdvisor;
    }
    
    /**
     * @dev Record user request
     * @param user User address
     * @param requestHash Request hash
     * @param cid IPFS content identifier
     * @param signature Backend signature for CID
     */
    function recordRequest(
        address user,
        bytes32 requestHash,
        string calldata cid,
        bytes memory signature
    ) external onlyAdvisor {
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(cid));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Recover signer address
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(signature);
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        
        // Verify signer is authorized advisor server
        require(signer == advisorServer, "Signature verification failed");
        
        // Record request
        _userRequests[user].requestHashes.push(requestHash);
        _userRequests[user].cids.push(cid);
        _userRequests[user].timestamps.push(block.timestamp);
        
        // Emit event
        emit RequestRecorded(user, requestHash, cid, block.timestamp);
    }
    
    /**
     * @dev Split signature into v, r, s components
     * @param sig Signature
     */
    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) {
            v += 27;
        }
        
        return (v, r, s);
    }
    
    /**
     * @dev Get user's request count
     * @param user User address
     */
    function getUserRequestCount(address user) external view returns (uint256) {
        return _userRequests[user].requestHashes.length;
    }
    
    /**
     * @dev Get details of user's request at specific index
     * @param user User address
     * @param index Request index
     */
    function getUserRequestAt(address user, uint256 index) external view returns (
        bytes32 requestHash,
        string memory cid,
        uint256 timestamp
    ) {
        require(index < _userRequests[user].requestHashes.length, "Index out of bounds");
        
        return (
            _userRequests[user].requestHashes[index],
            _userRequests[user].cids[index],
            _userRequests[user].timestamps[index]
        );
    }
    
    /**
     * @dev Custom getter for user requests (replaces the automatic public getter)
     * @param user User address
     */
    function getUserRequests(address user) external view returns (
        bytes32[] memory requestHashes,
        string[] memory cids,
        uint256[] memory timestamps
    ) {
        return (
            _userRequests[user].requestHashes,
            _userRequests[user].cids,
            _userRequests[user].timestamps
        );
    }
}