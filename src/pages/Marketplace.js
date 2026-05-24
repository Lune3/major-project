import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Clock, Search } from 'lucide-react';

export default function Marketplace({ account, contract }) {
  const [listing, setListing] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the data from the blockchain whenever the page loads or the contract changes
  useEffect(() => {
    loadLiveListing();
  }, [contract]);

  const loadLiveListing = async () => {
    if (!contract) return;
    try {
      const sellerAddress = await contract.methods.seller().call();
      
      // If the seller address is a zero address, no auction has been created yet
      if (sellerAddress === "0x0000000000000000000000000000000000000000") {
        setIsLoading(false);
        return;
      }

      // Fetch all state variables from the smart contract
      const cropType = await contract.methods.cropDetails().call();
      const highestBidWei = await contract.methods.highestBid().call();
      const buyoutPriceWei = await contract.methods.buyoutPrice().call();
      const endTime = await contract.methods.endTime().call();
      const isEnded = await contract.methods.ended().call();

      setListing({
        seller: sellerAddress,
        cropType: cropType,
        highestBid: Web3.utils.fromWei(highestBidWei.toString(), 'ether'),
        buyoutPrice: Web3.utils.fromWei(buyoutPriceWei.toString(), 'ether'),
        endTime: Number(endTime),
        ended: isEnded
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error reading from blockchain:", error);
      setIsLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!contract || !account) return alert("Please connect wallet.");
    if (!bidAmount) return alert("Please enter a bid amount.");

    try {
      const bidWei = Web3.utils.toWei(bidAmount.toString(), 'ether');
      
      // Trigger MetaMask to sign the bid transaction
      await contract.methods.placeBid().send({
        from: account,
        value: bidWei
      });
      
      alert("Bid successfully placed on the blockchain!");
      setBidAmount(''); // Clear input
      loadLiveListing(); // Refresh the UI with the new highest bid
    } catch (error) {
      console.error("Bidding failed:", error);
      alert("Bidding failed. Ensure your bid is higher than the current highest bid.");
    }
  };

  const handleBuyout = async () => {
    if (!contract || !account) return alert("Please connect wallet.");
    
    try {
      const buyoutWei = Web3.utils.toWei(listing.buyoutPrice.toString(), 'ether');
      
      await contract.methods.buyout().send({
        from: account,
        value: buyoutWei
      });
      
      alert("Buyout successful! The auction is now finalized.");
      loadLiveListing();
    } catch (error) {
      console.error("Buyout failed:", error);
    }
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
        <h3 className="font-bold text-xl mb-4">Live Auctions</h3>
        
        {!listing ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-stone-100">
            <Search className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 font-medium">No active crop listings found on the network.</p>
            <p className="text-sm text-stone-400">Head to the Dashboard to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            
            {/* The Dynamic Listing Card */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${listing.ended ? 'border-red-200 bg-stone-50' : 'border-stone-100'}`}>
              <div className="h-40 bg-stone-200 rounded-lg mb-4 overflow-hidden relative">
                {/* Visual placeholder for crop image */}
                <div className="absolute top-2 left-2 bg-white px-2 py-1 text-xs font-bold rounded shadow-sm text-stone-600">
                  {listing.ended ? 'CLOSED' : 'LIVE'}
                </div>
              </div>
              <h4 className="font-bold text-lg">{listing.cropType || "Premium Hard Red Wheat"}</h4>
              <p className="text-sm text-stone-500 mb-4 font-mono truncate">Seller: {listing.seller}</p>
              
              <div className="space-y-2 mb-4 border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Current Highest Bid:</span>
                  <span className="font-bold">{listing.highestBid} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Instant Buyout:</span>
                  <span className="font-bold text-agriGreen">{listing.buyoutPrice} ETH</span>
                </div>
              </div>

              {!listing.ended ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder={`> ${listing.highestBid} ETH`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1 p-2 border border-stone-300 rounded-md text-sm"
                    />
                    <button 
                      onClick={handlePlaceBid}
                      className="bg-agriGreen text-white px-4 py-2 rounded-md text-sm font-bold shadow hover:bg-emerald-800"
                    >
                      Place Bid
                    </button>
                  </div>
                  <button 
                    onClick={handleBuyout}
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
        )}
      </div>
    </div>
  );
}