// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AgriAuction {
    address payable public seller; // [cite: 234]
    string public cropDetails; // [cite: 235]
    uint256 public minBid; // [cite: 236]
    uint256 public buyoutPrice; // [cite: 237]
    uint256 public highestBid; // [cite: 238]
    address public highestBidder; // [cite: 238]
    uint256 public endTime; // [cite: 238]
    bool public ended; // [cite: 239]

    mapping(address => uint256) public pendingReturns; // [cite: 240]

    event HighestBidIncreased(address bidder, uint256 amount); // [cite: 295]
    event AuctionEnded(address winner, uint256 amount); // [cite: 295]

    modifier onlyBeforeEnd() { // [cite: 302]
        require(block.timestamp < endTime, "Auction already ended.");
        _;
    }

    modifier onlySeller() { // [cite: 302]
        require(msg.sender == seller, "Only seller can call this.");
        _;
    }

    function createListing(
        string memory _cropDetails,
        uint256 _minBid,
        uint256 _buyoutPrice,
        uint256 _biddingTime
    ) public { // [cite: 261]
        seller = payable(msg.sender);
        cropDetails = _cropDetails;
        minBid = _minBid;
        highestBid = _minBid;
        buyoutPrice = _buyoutPrice;
        endTime = block.timestamp + _biddingTime;
        ended = false; // [cite: 261]
    }

    function placeBid() public payable onlyBeforeEnd { // [cite: 262]
        require(msg.value > highestBid, "There already is a higher bid."); // [cite: 266]

        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid; // [cite: 254]
        }

        highestBidder = msg.sender; // [cite: 266]
        highestBid = msg.value; // [cite: 266]
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function buyout() public payable onlyBeforeEnd { // [cite: 267]
        require(msg.value >= buyoutPrice, "Funds do not meet buyout price."); // [cite: 287]

        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        ended = true; // [cite: 267]
        emit AuctionEnded(highestBidder, highestBid);
        
        seller.transfer(highestBid); // [cite: 288]
    }

    function withdraw() public returns (bool) { // [cite: 249]
        uint256 amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0; // [cite: 300]
            if (!payable(msg.sender).send(amount)) { // [cite: 300]
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function finalizeAuction() public { // [cite: 269]
        require(block.timestamp >= endTime, "Auction not yet ended.");
        require(!ended, "finalizeAuction has already been called.");

        ended = true; // [cite: 270]
        emit AuctionEnded(highestBidder, highestBid);
        seller.transfer(highestBid); // [cite: 270]
    }
}