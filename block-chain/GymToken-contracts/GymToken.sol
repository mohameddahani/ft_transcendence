// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import  "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import  "@openzeppelin/contracts/utils/Context.sol";

contract GymToken is ERC20("GymToken", "G"), Ownable(msg.sender), ERC2771Context{
    
    constructor(address trustedForwarder)
        ERC2771Context(trustedForwarder)
    {}

    struct product {
        string name;
        string description;
        uint256 stok;
        uint256 price;
        string[] productImages;
    }
    
    struct productById {
        uint256 id;
        product product;
    }
    
    struct sales {
        uint256 id;
        string productImage;
        string productName;
        address client;
        uint256 quantity;
        uint256 time;
        uint256 totalPrice;
        bool status;
    }
    
    struct purchases {
        uint256 id;
        string productImage;
        string productName;
        address gymOwner;
        uint256 quantity;
        uint256 time;
        uint256 totalPrice;
    }

    mapping(address => productById[]) internal marketplace;

    mapping(address => sales[]) internal salesGymOwner;
    mapping(address => purchases[]) internal purchasesClinet;


    event SubscriptionPaid(address indexed client, address indexed GymOwner, uint256 amount);
    event ProductBought(address indexed client, address indexed GymOwner, uint256 ProductId, uint256 quantity);
    event changeStatusSale(address indexed  gymOwner, sales sale, bool delivered);
    event addProductSucc(address indexed GymMarketplace, string productName, string description, uint256 stok, uint256 price);
    event editProductSucc(address indexed GymMarketplace, string  name, string  description, uint256 stok, uint256 price);
    event removeProductSucc(address indexed GymMarketplace, uint256 ProductId);

    function rewardTokenSubscription(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }

    function paySubscription(address GymOwner, uint256 amount) external {
        address clinet = _msgSender();
        _transfer(clinet, GymOwner, amount);
        emit SubscriptionPaid(clinet, GymOwner, amount);
    }

    function addProduct(uint256 _ProductId, string memory _name, string memory _description, uint256 _stok, uint256 _price, string[] memory _productImages) external {
        product memory newProduct = product(_name, _description, _stok, _price, _productImages);
        productById memory p = productById(_ProductId, newProduct);
        marketplace[_msgSender()].push(p);

        emit addProductSucc(_msgSender(), _name, _description, _stok, _price);
    }

    function findTheProductIndex(address addrMarketplace, uint256 _ProductId) internal view returns (uint256 index, bool found) {
        productById[] storage userProduct = marketplace[addrMarketplace];
        for (uint256 i = 0; i < userProduct.length; i++) {
            if (userProduct[i].id == _ProductId) {
                return (i, true);
            }
        }
        return (0, false);
    }

    function editProduct(uint256 _ProductId, string memory _name, string memory _description, uint256 _stok, uint256 _price, string[] memory _productImages) external {
        (uint256 index, bool found) = findTheProductIndex(_msgSender(), _ProductId);
        require(found, "Product Not Found");

        productById storage target = marketplace[_msgSender()][index];
        target.product.name = _name;
        target.product.description = _description;
        target.product.stok = _stok;
        target.product.price = _price;
        target.product.productImages = _productImages;

        emit editProductSucc(_msgSender(), _name, _description, _stok, _price);
    }

    function removeProduct(uint256 _ProductId) external {
        (uint256 index, bool found) = findTheProductIndex(_msgSender() ,_ProductId);
        require(found, "Product Not Found");

        productById[] storage userProduct = marketplace[_msgSender()];
        for (uint256 i = index; i < userProduct.length - 1; i++) {
            userProduct[i] = userProduct[i + 1];
        }

        userProduct.pop();

        emit removeProductSucc(_msgSender(), _ProductId);
    }


    function buyProduct(address addMarketplace, uint256 _ProductId, uint256 _quantity, uint256 _TotalPrice) internal {
        require(_quantity > 0, "Quantity must be greater than 0");
        (uint256 index, bool found) = findTheProductIndex(addMarketplace, _ProductId);
        require(found, "Product Not Found");

        uint256 totalPrice = marketplace[addMarketplace][index].product.price * _quantity;
        string memory productName = marketplace[addMarketplace][index].product.name;
        address _clinet = _msgSender();

        require(marketplace[addMarketplace][index].product.stok >= _quantity, "_quantity is not avilible is stell just marketplace[addMarketplace][index].product.stok");
        require(totalPrice <= _TotalPrice, "Price exceeds signed maximum");

        require(balanceOf(_clinet) >= totalPrice, "Price is not correct");
        marketplace[addMarketplace][index].product.stok -= _quantity;

        _transfer(_clinet, addMarketplace, totalPrice);
        emit ProductBought(_clinet, addMarketplace, _ProductId, _quantity);

        sales memory newSales = sales(salesGymOwner[addMarketplace].length, productName, _clinet, _quantity, block.timestamp, totalPrice, false);
        purchases memory newPurchases = purchases(purchasesClinet[_clinet].length, productName, addMarketplace, _quantity, block.timestamp, totalPrice);

        salesGymOwner[addMarketplace].push(newSales);
        purchasesClinet[_clinet].push(newPurchases);
    }


    function    getsales() external view returns (sales[] memory) {
        return salesGymOwner[_msgSender()];
    }

    function    getPurchases() external view returns (purchases[] memory) {
        return purchasesClinet[_msgSender()];
    }

    function changeStatus(uint256 index) external {
        sales storage sale = salesGymOwner[_msgSender()][index];
        sale.status = true;

        emit changeStatusSale(_msgSender() ,salesGymOwner[_msgSender()][index], true);
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
