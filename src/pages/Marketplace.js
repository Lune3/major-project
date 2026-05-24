import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Search } from 'lucide-react';

export default function Marketplace({ account, contract }) {
  const [listings, setListings] = useState([]);
  const [bidAmounts, setBidAmounts] = useState({}); // Stores input values for multiple cards
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllListings();
  }, [contract]);

  const loadAllListings = async () => {
    if (!contract) {
      setIsLoading(false);
      return;
    }
    try {
      // 1. Find out how many crops have been listed in total
      const count = await contract.methods.listingCounter().call();
      
      const fetchedListings = [];
      // 2. Loop through the mapping and fetch every single crop!
      for (let i = 1; i <= count; i++) {
        const auction = await contract.methods.auctions(i).call();
        
        fetchedListings.push({
          id: auction.id,
          seller: auction.seller,
          cropType: auction.cropDetails,
          highestBid: Web3.utils.fromWei(auction.highestBid.toString(), 'ether'),
          buyoutPrice: Web3.utils.fromWei(auction.buyoutPrice.toString(), 'ether'),
          endTime: Number(auction.endTime),
          ended: auction.ended
        });
      }

      // Reverse the array so the newest listings show up first
      setListings(fetchedListings.reverse());
      setIsLoading(false);
    } catch (error) {
      console.error("Error reading from blockchain:", error);
      setIsLoading(false);
    }
  };

  // We now pass the specific auctionId to the blockchain!
  const handlePlaceBid = async (auctionId) => {
    if (!contract || !account) return alert("Please connect wallet.");
    const amount = bidAmounts[auctionId];
    if (!amount) return alert("Please enter a bid amount.");

    try {
      const bidWei = Web3.utils.toWei(amount.toString(), 'ether');
      
      await contract.methods.placeBid(auctionId).send({
        from: account,
        value: bidWei
      });
      
      alert("Bid successfully placed!");
      // Clear the input for this specific card and refresh data
      setBidAmounts(prev => ({...prev, [auctionId]: ''})); 
      loadAllListings(); 
    } catch (error) {
      console.error("Bidding failed:", error);
      alert("Bidding failed. Ensure your bid is higher than the current highest bid.");
    }
  };

  const handleBuyout = async (auctionId, buyoutPrice) => {
    if (!contract || !account) return alert("Please connect wallet.");
    
    try {
      const buyoutWei = Web3.utils.toWei(buyoutPrice.toString(), 'ether');
      
      await contract.methods.buyout(auctionId).send({
        from: account,
        value: buyoutWei
      });
      
      alert("Buyout successful! The auction is now finalized.");
      loadAllListings();
    } catch (error) {
      console.error("Buyout failed:", error);
    }
  };

  // Helper to assign a specific image based on the crop name
  const getImageForCrop = (cropName) => {
    const name = cropName.toLowerCase();
    if (name.includes('rice')) return '/rice.jpg';
    if (name.includes('corn')) return '/corn.jpg';
    return '/wheat.jpg'; // Default fallback
  };

  if (isLoading) return <div className="p-8 text-stone-500 font-bold">Querying the blockchain...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8">
      {/* Sidebar Filters */}
      <div className="w-1/4">
        <h3 className="font-bold mb-4 text-xl">Filters</h3>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-stone-500 block mb-1">Crop Type</label>
            <select className="w-full p-2 border rounded-md bg-white"><option>All Crops</option></select>
          </div>
          <div>
            <label className="text-sm text-stone-500 block mb-1">Location</label>
            <select className="w-full p-2 border rounded-md bg-white"><option>Hapur, Uttar Pradesh</option></select>
          </div>
        </div>
      </div>

      {/* Live Marketplace Grid */}
      <div className="w-3/4">
        <h3 className="font-bold text-xl mb-4">Live Auctions ({listings.length})</h3>
        
        {listings.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-stone-100">
            <Search className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 font-medium">No active crop listings found on the network.</p>
            <p className="text-sm text-stone-400">Head to the Dashboard to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            
            {/* Map through EVERY listing on the blockchain */}
            {listings.map((listing) => (
              <div key={listing.id} className={`bg-white rounded-2xl shadow-md border overflow-hidden ${listing.ended ? 'border-red-200 bg-stone-50' : 'border-stone-100 hover:shadow-lg transition-shadow'}`}>
                
                {/* IMAGE HEADER */}
                <div className="h-56 relative">
                  <img 
                    src={getImageForCrop(listing.cropType)} 
                    alt={listing.cropType} 
                    className={`w-full h-full object-cover ${listing.ended ? 'grayscale opacity-70' : ''}`} 
                  />
                  <div className={`absolute top-4 left-4 backdrop-blur-sm px-4 py-1.5 text-xs font-black rounded-md shadow-lg tracking-wide ${
                    listing.ended ? 'bg-red-600 text-white' : 'bg-white/95 text-emerald-700'
                  }`}>
                    {listing.ended ? 'AUCTION CLOSED' : `ID: #${listing.id} LIVE`}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-bold text-xl mb-1 truncate">{listing.cropType}</h4>
                  <p className="text-sm text-stone-500 mb-5 font-mono truncate">Seller: {listing.seller}</p>
                  
                  <div className="space-y-3 mb-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500 font-medium">Current Highest Bid</span>
                      <span className="font-black text-lg">{listing.highestBid} ETH</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500 font-medium">Instant Buyout</span>
                      <span className="font-black text-lg text-agriGreen">{listing.buyoutPrice} ETH</span>
                    </div>
                  </div>

                  {!listing.ended ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder={`> ${listing.highestBid} ETH`}
                          value={bidAmounts[listing.id] || ''}
                          onChange={(e) => setBidAmounts({...bidAmounts, [listing.id]: e.target.value})}
                          className="flex-1 p-2 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-agriGreen"
                        />
                        <button 
                          onClick={() => handlePlaceBid(listing.id)}
                          className="bg-agriGreen text-white px-4 py-2 rounded-md text-sm font-bold shadow hover:bg-emerald-800"
                        >
                          Place Bid
                        </button>
                      </div>
                      <button 
                        onClick={() => handleBuyout(listing.id, listing.buyoutPrice)}
                        className="w-full border-2 border-agriGreen text-agriGreen py-2 rounded-md text-sm font-bold hover:bg-emerald-50"
                      >
                        Execute Buyout ({listing.buyoutPrice} ETH)
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-stone-200 rounded-md text-stone-600 font-bold">
                      Auction Finalized
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}