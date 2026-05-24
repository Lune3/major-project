// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AgriMarketplace {
    
    // 1. The Blueprint for a single Auction
    struct Auction {
        uint256 id;
        address payable seller;
        string cropDetails;
        uint256 minBid;
        uint256 buyoutPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool ended;
    }

    // 2. The Database holding all active/past auctions
    uint256 public listingCounter = 0;
    mapping(uint256 => Auction) public auctions;
    
    // Track pending returns globally (mapped by user address, then by auction ID if needed, 
    // but a global mapping is easier: userAddress => total pending ETH)
    mapping(address => uint256) public pendingReturns;

    event ListingCreated(uint256 indexed auctionId, address seller, string cropDetails);
    event HighestBidIncreased(uint256 indexed auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);

    // Modifier now checks a specific auction ID
    modifier onlyBeforeEnd(uint256 _auctionId) {
        require(block.timestamp < auctions[_auctionId].endTime, "Auction already ended.");
        _;
    }

    // Create a BRAND NEW auction without overwriting the others
    function createListing(
        string memory _cropDetails,
        uint256 _minBid,
        uint256 _buyoutPrice,
        uint256 _biddingTime
    ) public {
        listingCounter++; // Increment ID for the new listing
        
        auctions[listingCounter] = Auction({
            id: listingCounter,
            seller: payable(msg.sender),
            cropDetails: _cropDetails,
            minBid: _minBid,
            buyoutPrice: _buyoutPrice,
            highestBid: _minBid,
            highestBidder: address(0),
            endTime: block.timestamp + _biddingTime,
            ended: false
        });

        emit ListingCreated(listingCounter, msg.sender, _cropDetails);
    }

    function placeBid(uint256 _auctionId) public payable onlyBeforeEnd(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(msg.value > auction.highestBid, "There already is a higher bid.");

        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        emit HighestBidIncreased(_auctionId, msg.sender, msg.value);
    }

    function buyout(uint256 _auctionId) public payable onlyBeforeEnd(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(msg.value >= auction.buyoutPrice, "Funds do not meet buyout price.");

        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        auction.ended = true; 
        
        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        auction.seller.transfer(auction.highestBid);
    }

    // Pull over push remains the same, it just withdraws the user's total global balance
    function withdraw() public returns (bool) {
        uint256 amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            if (!payable(msg.sender).send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function finalizeAuction(uint256 _auctionId) public {
        Auction storage auction = auctions[_auctionId];
        require(block.timestamp >= auction.endTime, "Auction not yet ended.");
        require(!auction.ended, "finalizeAuction has already been called.");
        require(msg.sender == auction.seller, "Only the seller can finalize.");

        auction.ended = true;
        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        
        if (auction.highestBidder != address(0)) {
            auction.seller.transfer(auction.highestBid);
        }
    }
}