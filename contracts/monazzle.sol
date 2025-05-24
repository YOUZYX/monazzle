// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title IEntryPoint
 * @dev Interface for the ERC-4337 EntryPoint contract.
 * This is a simplified version for the needs of this contract.
 */
interface IEntryPoint {
    function depositTo(address account) external payable;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Monazzle
 * @dev An on-chain jigsaw puzzle mini-game on Monad Testnet.
 * Users interact with this contract, and transactions are funded via their AA wallets
 * through a Biconomy Nexus bundler compatible with ERC-4337 UserOperations.
 * Off-chain services handle puzzle shuffling, hint generation, AI solving, and final verification.
 */
contract Monazzle is Ownable, ReentrancyGuard, ERC721URIStorage {
    using Counters for Counters.Counter;

    // --------------- State Variables & Constants ---------------

    Counters.Counter private _monazzleIdCounter;
    Counters.Counter private _globalTokenIdCounter;

    mapping(uint256 => uint256) public monazzleToTokenId;

    uint256 public constant HINT_COST = 0.1 ether;
    uint256 public constant AI_COST = 1 ether;

    IEntryPoint public immutable entryPoint;

    struct Game {
        bytes32 imageHash;      // Hash of the original, solved puzzle image
        uint8 level;            // Difficulty level (e.g., 1=3x3, 2=4x4, 3=5x5)
        uint256 movesCount;     // Number of piece swaps made by the user
        uint256 hintsUsed;      // Number of hints requested by the user
        bool aiUsed;            // Flag indicating if the AI solver was activated
        uint256 startTime;      // Timestamp when the game started
        bool isFinished;        // Flag indicating if the game has been successfully completed
        address winner;         // Address of the player who completed the monazzle
    }

    mapping(uint256 => Game) public monazzles;

    // --------------- Events ---------------

    event MonazzleCommitted(uint256 indexed monazzleId, bytes32 imageHash);
    event MonazzleStarted(uint256 indexed monazzleId, uint8 level, address indexed player);
    event PieceSwapped(uint256 indexed monazzleId, uint8 idxA, uint8 idxB, address indexed player);
    event HintRequested(uint256 indexed monazzleId, address indexed player);
    event AISolverRequested(uint256 indexed monazzleId, address indexed player);
    event MonazzleFinished(uint256 indexed monazzleId, address indexed winner, uint256 timeSpent);
    event MonazzleMinted(uint256 indexed monazzleId, uint256 indexed tokenId, address indexed owner, string tokenURI);

    // --------------- Constructor ---------------

    /**
     * @dev Sets the EntryPoint address for ERC-4337 UserOperation compatibility.
     * @param initialOwner The address that will be the owner of this contract.
     * @param entryPointAddress The address of the Biconomy Nexus (or other ERC-4337) EntryPoint.
     */
    constructor(address initialOwner, IEntryPoint entryPointAddress)
        Ownable(initialOwner)
        ERC721("MonazzlePuzzleNFT", "MPNFT")
    {
        require(address(entryPointAddress) != address(0), "Monazzle: EntryPoint address cannot be zero");
        entryPoint = entryPointAddress;
    }

    // --------------- Functions ---------------

    /**
     * @dev Commits an image hash to the contract. Called by an off-chain service.
     * This step is typically done by a trusted operator or an automated system
     * that prepares the puzzle images.
     * @param imageHash The keccak256 hash of the puzzle image.
     * @return monazzleId The ID for the newly committed monazzle.
     */
    function commitImage(bytes32 imageHash) external returns (uint256) {
        _monazzleIdCounter.increment();
        uint256 monazzleId = _monazzleIdCounter.current();
        monazzles[monazzleId].imageHash = imageHash;
        emit MonazzleCommitted(monazzleId, imageHash);
        return monazzleId;
    }

    /**
     * @dev Starts a new Monazzle game for a given committed image.
     * @param monazzleId The ID of the Monazzle (puzzle) to start.
     * @param level The difficulty level for this game instance (1, 2, or 3).
     */
    function startMonazzle(uint256 monazzleId, uint8 level) external {
        Game storage game = monazzles[monazzleId];
        require(game.imageHash != bytes32(0), "Monazzle: Game for this ID has not been committed");
        require(game.startTime == 0, "Monazzle: Game already started"); // Prevents restarting
        require(level >= 1 && level <= 3, "Monazzle: Invalid level (must be 1, 2, or 3)");

        game.level = level;
        game.startTime = block.timestamp;
        // game.winner is implicitly address(0) initially
        // game.movesCount, game.hintsUsed, game.aiUsed, game.isFinished are default (0 or false)

        emit MonazzleStarted(monazzleId, level, msg.sender);
    }

    /**
     * @dev Records a piece swap action by the player.
     * Off-chain logic verifies the swap validity.
     * @param monazzleId The ID of the Monazzle being played.
     * @param idxA The index of the first piece being swapped.
     * @param idxB The index of the second piece being swapped.
     */
    function swapPiece(uint256 monazzleId, uint8 idxA, uint8 idxB) external nonReentrant {
        Game storage game = monazzles[monazzleId];
        require(game.startTime > 0, "Monazzle: Game not started");
        require(!game.isFinished, "Monazzle: Game already finished");
        // Basic check, detailed validation of idxA, idxB might be too complex/costly on-chain
        require(idxA != idxB, "Monazzle: Cannot swap a piece with itself");


        game.movesCount++;
        emit PieceSwapped(monazzleId, idxA, idxB, msg.sender);
    }

    /**
     * @dev Allows a player to request a hint by paying HINT_COST.
     * The actual hint is provided off-chain.
     * @param monazzleId The ID of the Monazzle being played.
     */
    function requestHint(uint256 monazzleId) external payable nonReentrant {
        Game storage game = monazzles[monazzleId];
        require(game.startTime > 0, "Monazzle: Game not started");
        require(!game.isFinished, "Monazzle: Game already finished");
        require(msg.value == HINT_COST, "Monazzle: Incorrect payment for hint");

        // Note: Funds are sent to this contract.
        // For UserOps, the EntryPoint handles payment to the bundler/paymaster.
        // This payable function implies the user (or their AA wallet) directly sends ETH here.
        // If using a Paymaster to sponsor hints, this logic might change.

        game.hintsUsed++;
        emit HintRequested(monazzleId, msg.sender);
    }

    /**
     * @dev Allows a player to activate an AI solver by paying AI_COST.
     * The AI solving process happens off-chain.
     * @param monazzleId The ID of the Monazzle being played.
     */
    function activateAISolver(uint256 monazzleId) external payable nonReentrant {
        Game storage game = monazzles[monazzleId];
        require(game.startTime > 0, "Monazzle: Game not started");
        require(!game.isFinished, "Monazzle: Game already finished");
        require(msg.value == AI_COST, "Monazzle: Incorrect payment for AI solver");
        require(!game.aiUsed, "Monazzle: AI solver already activated for this game");

        // Similar to requestHint, funds are sent to this contract.

        game.aiUsed = true;
        emit AISolverRequested(monazzleId, msg.sender);
    }

    /**
     * @dev Marks a Monazzle as finished. Called by the contract owner (likely an off-chain service)
     * after verifying the puzzle solution submitted by the player.
     * @param monazzleId The ID of the Monazzle that was finished.
     * @param playerAddress The address of the player who finished the puzzle.
     * @param timeSpent The total time the player spent on the puzzle (calculated off-chain).
     */
    function finishMonazzle(uint256 monazzleId, address playerAddress, uint256 timeSpent) external {
        Game storage game = monazzles[monazzleId];
        require(game.startTime > 0, "Monazzle: Game not started");
        require(!game.isFinished, "Monazzle: Game already finished");
        require(playerAddress != address(0), "Monazzle: Player address cannot be zero");


        game.isFinished = true;
        game.winner = playerAddress; // Set the winner explicitly
        // timeSpent is provided as parameter, assuming it's verified off-chain.

        emit MonazzleFinished(monazzleId, playerAddress, timeSpent);
    }

    /**
     * @dev Mints an NFT for a completed Monazzle to the winner.
     * The winner of the game calls this function to claim their NFT.
     * @param monazzleId The ID of the finished Monazzle.
     * @param tokenURI The URI for the NFT's metadata (e.g., IPFS link).
     * @return tokenId The ID of the newly minted NFT.
     */
    function mintMonazzleNFT(uint256 monazzleId, string calldata tokenURI) external nonReentrant returns (uint256) {
        Game storage game = monazzles[monazzleId];
        require(game.isFinished, "Monazzle: Game not finished");
        require(msg.sender == game.winner, "Monazzle: Only winner can mint");
        require(monazzleToTokenId[monazzleId] == 0, "Monazzle: NFT already minted for this game");

        _globalTokenIdCounter.increment();
        uint256 newTokenId = _globalTokenIdCounter.current();

        monazzleToTokenId[monazzleId] = newTokenId;
        _safeMint(game.winner, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit MonazzleMinted(monazzleId, newTokenId, game.winner, tokenURI);
        return newTokenId;
    }

    // --------------- ERC721 Overrides (Optional but good practice) ---------------

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     * Overridden to use ERC721URIStorage's implementation.
     */
    function tokenURI(uint256 tokenId) public view virtual override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev See {IERC721-supportsInterface}.
     * Overridden to include ERC721URIStorage interface.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // --------------- Internal Helper Functions (if any) ---------------
    // (None explicitly requested, but can be added if logic becomes complex)

    // --------------- Fallback and Receive (for receiving ETH directly) ---------------
    // receive() external payable {}
    // fallback() external payable {}
    // Not strictly needed if all ETH transfers are via specific functions like requestHint/activateAISolver
    // and Biconomy handles funding. But good to be aware of if contract needs to receive plain ETH.
    // For now, let's omit them as per "No deposit/withdraw functions needed".
}