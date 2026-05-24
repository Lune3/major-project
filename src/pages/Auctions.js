import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function Auctions({ account, contract }) {
  const [pendingReturn, setPendingReturn] = useState('0');
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (contract && account) {
      fetchAuctionData();
    }
  }, [contract, account]);

  const fetchAuctionData = async () => {
    setIsLoading(true);
    try {
      // 1. Check if the connected user was outbid and has funds to withdraw
      const returnsWei = await contract.methods.pendingReturns(account).call();
      setPendingReturn(Web3.utils.fromWei(returnsWei.toString(), 'ether'));

      // 2. Fetch the active auction status for the data table
      const sellerAddress = await contract.methods.seller().call();
      if (sellerAddress !== "0x0000000000000000000000000000000000000000") {
        const cropType = await contract.methods.cropDetails().call();
        const highestBidWei = await contract.methods.highestBid().call();
        const isEnded = await contract.methods.ended().call();
        
        setListing({
          cropType,
          highestBid: Web3.utils.fromWei(highestBidWei.toString(), 'ether'),
          ended: isEnded
        });
      }
    } catch (error) {
      console.error("Error fetching auction data:", error);
    }
    setIsLoading(false);
  };

  const handleWithdraw = async () => {
    if (pendingReturn === '0') return alert("No funds to withdraw.");
    
    try {
      // Execute the secure Pull-over-Push withdrawal
      await contract.methods.withdraw().send({ from: account });
      alert("Funds successfully withdrawn to your wallet!");
      fetchAuctionData(); // Refresh the balance
    } catch (error) {
      console.error("Withdraw failed:", error);
      alert("Withdrawal failed. Check the console for details.");
    }
  };

  if (isLoading) return <div className="p-8 text-stone-500 font-bold">Querying the blockchain...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auctions Dashboard</h1>
          <p className="text-stone-500">Track live listings and manage your secure refunds.</p>
        </div>
        
        {/* Secure Withdrawal Panel (Pull over Push Implementation) */}
        <div className={`border-2 p-5 rounded-xl flex items-center gap-6 shadow-sm transition-colors ${
          pendingReturn !== '0' ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center gap-3">
            {pendingReturn !== '0' ? (
              <AlertCircle className="w-8 h-8 text-orange-500" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            )}
            <div>
              <p className={`text-sm font-bold ${pendingReturn !== '0' ? 'text-orange-800' : 'text-stone-500'}`}>
                Pending Refunds (Outbid)
              </p>
              <p className={`text-2xl font-mono ${pendingReturn !== '0' ? 'text-orange-600 font-bold' : 'text-stone-400'}`}>
                {pendingReturn} ETH
              </p>
            </div>
          </div>
          <button 
            onClick={handleWithdraw}
            disabled={pendingReturn === '0'}
            className={`px-6 py-3 rounded-md font-bold text-sm transition-colors ${
              pendingReturn !== '0' 
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md' 
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Live Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-agriGreen text-white text-sm">
              <th className="p-4 font-medium">Listing Details</th>
              <th className="p-4 font-medium">Current Highest Bid</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {listing ? (
              <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-md"></div>
                  <span className="font-bold text-stone-800">{listing.cropType}</span>
                </td>
                <td className="p-4 font-mono font-bold text-agriGreen">
                  {listing.highestBid} ETH
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    listing.ended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {listing.ended ? 'Finalized' : 'Active'}
                  </span>
                </td>
                <td className="p-4">
                  <button className="bg-stone-100 text-stone-600 px-4 py-2 rounded-md text-sm font-bold hover:bg-stone-200">
                    View Ledger
                  </button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-stone-500">
                  No active listings found on the network.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}