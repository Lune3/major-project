import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { CheckCircle } from 'lucide-react';

export default function Dashboard({ account, contract }) {
  const [cropType, setCropType] = useState('Wheat');
  const [minBid, setMinBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  
  // States for Farmer's Active Auction
  const [myAuction, setMyAuction] = useState(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (contract && account) {
      loadMyAuction();
    }
    // Update local time every second to compare against block timestamp
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, [contract, account]);

  const loadMyAuction = async () => {
    try {
      const sellerAddress = await contract.methods.seller().call();
      
      // Only show the management panel if the connected user is the seller
      if (sellerAddress.toLowerCase() === account.toLowerCase()) {
        const highestBidWei = await contract.methods.highestBid().call();
        const endTime = await contract.methods.endTime().call();
        const isEnded = await contract.methods.ended().call();

        setMyAuction({
          highestBid: Web3.utils.fromWei(highestBidWei.toString(), 'ether'),
          endTime: Number(endTime),
          ended: isEnded
        });
      }
    } catch (error) {
      console.error("Error loading auction:", error);
    }
  };

  const handleDeployToBlockchain = async (e) => {
    e.preventDefault();
    if (!contract || !account) return alert("Please connect your wallet first.");

    try {
      const minBidWei = Web3.utils.toWei(minBid.toString(), 'ether');
      const buyoutWei = Web3.utils.toWei(buyoutPrice.toString(), 'ether');
      
      // Changed from 86400 (1 day) to 60 seconds for testing!
      const biddingTime = 60; 

      await contract.methods.createListing(
        cropType, 
        minBidWei, 
        buyoutWei, 
        biddingTime
      ).send({ from: account });

      alert("Listing successfully deployed to the blockchain!");
      loadMyAuction(); // Refresh the panel
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleFinalize = async () => {
    try {
      await contract.methods.finalizeAuction().send({ from: account });
      alert("Auction Finalized! Funds have been securely transferred to your wallet.");
      loadMyAuction();
    } catch (error) {
      console.error("Finalization failed:", error);
      alert("Cannot finalize yet. Ensure the timer has run out!");
    }
  };

  const isTimeUp = myAuction ? currentTime >= myAuction.endTime : false;

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      
      {/* Create Listing Form */}
      <div className="w-1/2">
        <h1 className="text-2xl font-bold mb-6">Farmer Dashboard</h1>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold mb-4">Create New Auction (1 Min Test)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-500 mb-1">Minimum Bid (ETH)</label>
              <input 
                type="text" 
                value={minBid} 
                onChange={(e) => setMinBid(e.target.value)} 
                className="w-full p-2 border rounded-md"
                placeholder="e.g. 0.145"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-500 mb-1">Buyout Price (ETH)</label>
              <input 
                type="text" 
                value={buyoutPrice} 
                onChange={(e) => setBuyoutPrice(e.target.value)} 
                className="w-full p-2 border rounded-md"
                placeholder="e.g. 38.00"
              />
            </div>
            <button 
              onClick={handleDeployToBlockchain}
              className="w-full bg-agriGreen text-white py-3 rounded-md font-bold mt-4 hover:bg-emerald-800 transition-colors"
            >
              Deploy to Blockchain
            </button>
          </div>
        </div>
      </div>

      {/* Manage Active Auction Panel */}
      <div className="w-1/2">
        <h2 className="text-2xl font-bold mb-6 text-transparent select-none">Spacer</h2>
        {myAuction ? (
          <div className={`p-6 rounded-xl shadow-sm border-2 ${myAuction.ended ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}>
            <h2 className="text-xl font-bold mb-4">Manage Active Auction</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b pb-2">
                <span className="text-stone-500">Current Highest Bid:</span>
                <span className="font-bold text-agriGreen">{myAuction.highestBid} ETH</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-stone-500">Status:</span>
                <span className="font-bold">{myAuction.ended ? 'Closed & Settled' : 'In Progress'}</span>
              </div>
            </div>

            {myAuction.ended ? (
              <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-100 p-4 rounded-lg justify-center">
                <CheckCircle className="w-5 h-5" /> Funds Transferred Successfully
              </div>
            ) : (
              <div>
                <button 
                  onClick={handleFinalize}
                  disabled={!isTimeUp}
                  className={`w-full py-3 rounded-md font-bold transition-colors ${
                    isTimeUp 
                      ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600' 
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {isTimeUp ? 'Finalize & Claim Funds' : 'Waiting for Timer to End...'}
                </button>
                {!isTimeUp && (
                  <p className="text-xs text-center text-stone-500 mt-2">
                    Button unlocks 60 seconds after deployment.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-stone-50 p-8 rounded-xl border border-stone-200 text-center text-stone-500">
            You do not currently have an active crop listing.
          </div>
        )}
      </div>

    </div>
  );
}