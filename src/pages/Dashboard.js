import React, { useState } from 'react';
import Web3 from 'web3';

export default function Dashboard({ account, contract }) {
  const [cropType, setCropType] = useState('Wheat');
  const [minBid, setMinBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');

  const handleDeployToBlockchain = async (e) => {
    e.preventDefault();
    if (!contract || !account) return alert("Please connect your wallet first.");

    try {
      const minBidWei = Web3.utils.toWei(minBid.toString(), 'ether');
      const buyoutWei = Web3.utils.toWei(buyoutPrice.toString(), 'ether');
      const biddingTime = 86400;

      await contract.methods.createListing(
        cropType, 
        minBidWei, 
        buyoutWei, 
        biddingTime
      ).send({ from: account });

      alert("Listing successfully deployed to the blockchain!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Farmer Dashboard</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg">
        <h2 className="text-lg font-bold mb-4">Create New Auction</h2>
        
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
            className="w-full bg-agriGreen text-white py-2 rounded-md font-bold mt-4"
          >
            Deploy to Blockchain
          </button>
        </div>
      </div>
    </div>
  );
}