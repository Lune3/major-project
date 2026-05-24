import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { CheckCircle, Clock } from 'lucide-react';

export default function Dashboard({ account, contract }) {
  // Form State (Now includes cropType!)
  const [cropType, setCropType] = useState('');
  const [minBid, setMinBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  
  // States for Farmer's Multiple Auctions
  const [myAuctions, setMyAuctions] = useState([]);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (contract && account) {
      loadMyAuctions();
    }
    // Update local time every second to check which timers have expired
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, [contract, account]);

  const loadMyAuctions = async () => {
    try {
      const count = await contract.methods.listingCounter().call();
      const fetched = [];
      
      // Loop through all auctions to find the ones owned by THIS connected farmer
      for (let i = 1; i <= count; i++) {
        const auction = await contract.methods.auctions(i).call();
        
        if (auction.seller.toLowerCase() === account.toLowerCase()) {
          fetched.push({
            id: auction.id,
            cropType: auction.cropDetails,
            highestBid: Web3.utils.fromWei(auction.highestBid.toString(), 'ether'),
            endTime: Number(auction.endTime),
            ended: auction.ended
          });
        }
      }
      // Reverse so newest listings show up at the top
      setMyAuctions(fetched.reverse());
    } catch (error) {
      console.error("Error loading auctions:", error);
    }
  };

  const handleDeployToBlockchain = async (e) => {
    e.preventDefault();
    if (!contract || !account) return alert("Please connect your wallet first.");
    if (!cropType) return alert("Please enter a crop name.");

    try {
      const minBidWei = Web3.utils.toWei(minBid.toString(), 'ether');
      const buyoutWei = Web3.utils.toWei(buyoutPrice.toString(), 'ether');
      const biddingTime = 60; // 60 seconds for quick testing

      await contract.methods.createListing(
        cropType, 
        minBidWei, 
        buyoutWei, 
        biddingTime
      ).send({ from: account });

      alert("Listing successfully deployed to the blockchain!");
      
      // Clear form and refresh UI
      setCropType('');
      setMinBid('');
      setBuyoutPrice('');
      loadMyAuctions(); 
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleFinalize = async (auctionId) => {
    try {
      // Pass the specific ID so the contract knows WHICH auction to finalize
      await contract.methods.finalizeAuction(auctionId).send({ from: account });
      alert("Auction Finalized! Funds have been securely transferred to your wallet.");
      loadMyAuctions();
    } catch (error) {
      console.error("Finalization failed:", error);
      alert("Cannot finalize yet. Ensure the timer has run out!");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-10">
      
      {/* Create Listing Form */}
      <div className="w-1/3">
        <h1 className="text-3xl font-bold mb-6">Farmer Dashboard</h1>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 sticky top-8">
          <h2 className="text-xl font-bold mb-6 text-stone-800">Create New Listing</h2>
          <div className="space-y-5">
            
            {/* NEW CROP INPUT FIELD */}
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Crop Name</label>
              <input 
                type="text" 
                value={cropType} 
                onChange={(e) => setCropType(e.target.value)} 
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-agriGreen outline-none"
                placeholder="e.g. Premium Basmati Rice"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Minimum Bid (ETH)</label>
              <input 
                type="number" 
                value={minBid} 
                onChange={(e) => setMinBid(e.target.value)} 
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-agriGreen outline-none"
                placeholder="e.g. 0.145"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Buyout Price (ETH)</label>
              <input 
                type="number" 
                value={buyoutPrice} 
                onChange={(e) => setBuyoutPrice(e.target.value)} 
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-agriGreen outline-none"
                placeholder="e.g. 2.5"
              />
            </div>

            <button 
              onClick={handleDeployToBlockchain}
              className="w-full bg-agriGreen text-white py-3.5 rounded-lg font-bold shadow-md hover:bg-emerald-800 transition-transform hover:scale-[1.02]"
            >
              Deploy to Blockchain
            </button>
            <p className="text-xs text-center text-stone-400 font-medium">Test timers are set to 60 seconds</p>
          </div>
        </div>
      </div>

      {/* Manage Active Auctions Panel */}
      <div className="w-2/3">
        <h2 className="text-2xl font-bold mb-6 text-stone-800">Manage My Listings</h2>
        
        {myAuctions.length > 0 ? (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {myAuctions.map((auction) => {
              const isTimeUp = currentTime >= auction.endTime;
              
              return (
                <div key={auction.id} className={`p-6 rounded-2xl shadow-sm border-2 transition-colors ${
                  auction.ended ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200 hover:border-stone-300'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black bg-stone-100 text-stone-500 px-2 py-1 rounded">ID: #{auction.id}</span>
                        {!auction.ended && !isTimeUp && (
                          <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Timer Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-stone-800">{auction.cropType}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500 font-medium">Current Highest Bid</p>
                      <p className="text-2xl font-black text-agriGreen">{auction.highestBid} ETH</p>
                    </div>
                  </div>

                  {auction.ended ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-100/50 p-3 rounded-lg justify-center border border-emerald-200">
                      <CheckCircle className="w-5 h-5" /> Funds Transferred & Auction Settled
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleFinalize(auction.id)}
                      disabled={!isTimeUp}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        isTimeUp 
                          ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:scale-[1.01]' 
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                      }`}
                    >
                      {isTimeUp ? 'Finalize & Claim Funds' : 'Waiting for Timer to End...'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-stone-200 text-center text-stone-500 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-bold text-stone-700 mb-1">No Active Listings</h3>
            <p>You have not deployed any crops to the blockchain yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}