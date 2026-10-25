// Set this to the address of the new contract deployed from contracts/GymToken.sol in Remix.
export const CONTRACT_ADDRESS = process.env.GYMTOKEN_ADDRESS ?? ''
export const FORWARDER_ADDRESS = process.env.FORWARDER_ADDRESS ?? ''
export const GASLESS_ENABLED = Boolean(process.env.GYMTOKEN_ADDRESS && FORWARDER_ADDRESS)
export const CHAIN_ID = 11155111
export const CHAIN_NAME = 'Sepolia'
export const EXPLORER_BASE = 'https://sepolia.etherscan.io'

export const GYMTOKEN_ABI = [
  // ERC20
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",

  // Ownership
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function renounceOwnership()",

  // Trusted Forwarder
  "function trustedForwarder() view returns (address)",
  "function isTrustedForwarder(address forwarder) view returns (bool)",

  // Subscription
  "function rewardTokenSubscription(address recipient, uint256 amount)",
  "function paySubscription(address GymOwner, uint256 amount)",

  // Marketplace
  "function addProduct(uint256 _ProductId, string _name, string _description, uint256 _stok, uint256 _price, string[] _productImages)",

  "function editProduct(uint256 _ProductId, string _name, string _description, uint256 _stok, uint256 _price, string[] _productImages)",

  "function removeProduct(uint256 _ProductId)",

  "function buyProduct(address addMarketplace, uint256 _ProductId, uint256 _quantity, uint256 _TotalPrice)",

  "function getMerchantProducts(address _merchantAddress) view returns ((uint256 id, (string name, string description, uint256 stok, uint256 price, string[] productImages) product)[])",

  // Purchases
  "function getPurchases() view returns ((uint256 id, string productName, address gymOwner, uint256 quantity, uint256 time, uint256 totalPrice)[])",

  // Sales
  "function getsales() view returns ((uint256 id, string productName, address client, uint256 quantity, uint256 time, uint256 totalPrice, bool status)[])",

  "function changeStatus(uint256 index)",

  // ERC20 Events
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",

  // Ownership Event
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",

  // GymToken Events
  "event SubscriptionPaid(address indexed client, address indexed GymOwner, uint256 amount)",

  "event ProductBought(address indexed client, address indexed GymOwner, uint256 ProductId, uint256 quantity)",

  "event addProductSucc(address indexed GymMarketplace, string productName, string description, uint256 stok, uint256 price)",

  "event editProductSucc(address indexed GymMarketplace, string name, string description, uint256 stok, uint256 price)",

  "event removeProductSucc(address indexed GymMarketplace, uint256 ProductId)",

  "event changeStatusSale(address indexed gymOwner, (uint256 id, string productImage, string productName, address client, uint256 quantity, uint256 time, uint256 totalPrice, bool status) sale, bool delivered)",

  // OpenZeppelin custom errors
  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InvalidApprover(address approver)",
  "error ERC20InvalidReceiver(address receiver)",
  "error ERC20InvalidSender(address sender)",
  "error ERC20InvalidSpender(address spender)",
  "error OwnableInvalidOwner(address owner)",
  "error OwnableUnauthorizedAccount(address account)",
] as const;

export const FORWARDER_ABI = [
  // =========================================================
  // FUNCTIONS
  // =========================================================

  "function nonces(address owner) view returns (uint256)",

  "function verify((address from, address to, uint256 value, uint256 gas, uint48 deadline, bytes data, bytes signature) request) view returns (bool)",

  "function execute((address from, address to, uint256 value, uint256 gas, uint48 deadline, bytes data, bytes signature) request) payable",

  "function executeBatch((address from, address to, uint256 value, uint256 gas, uint48 deadline, bytes data, bytes signature)[] requests, address payable refundReceiver) payable",

  "function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)",


  // =========================================================
  // EVENTS
  // =========================================================

  "event ExecutedForwardRequest(address indexed signer, uint256 nonce, bool success)",

  "event EIP712DomainChanged()",


  // =========================================================
  // ERC2771 FORWARDER ERRORS
  // =========================================================

  "error ERC2771ForwarderInvalidSigner(address signer, address from)",

  "error ERC2771ForwarderMismatchedValue(uint256 requestedValue, uint256 msgValue)",

  "error ERC2771ForwarderExpiredRequest(uint48 deadline)",

  "error ERC2771UntrustfulTarget(address target, address forwarder)",


  // =========================================================
  // ADDRESS / LOW-LEVEL CALL ERRORS
  // =========================================================

  "error AddressEmptyCode(address target)",

  "error FailedCall()",


  // =========================================================
  // EIP-712 ERRORS
  // =========================================================

  "error InvalidShortString()",

  "error StringTooLong(string str)",
] as const;