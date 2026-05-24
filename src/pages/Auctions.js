import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ShieldCheck, AlertCircle, History, X, ExternalLink } from 'lucide-react';

export default function Auctions({ account, contract }) {
  const [pendingReturn, setPendingReturn] = useState('0');
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New States for the Ledger Modal
  const [showLedger, setShowLedger] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  useEffect(() => {
    if (contract && account) {
      fetchAuctionData();
    } else {
      setIsLoading(false);
    }
  }, [contract, account]);

  const fetchAuctionData = async () => {
    setIsLoading(true);
    try {
      const returnsWei = await contract.methods.pendingReturns(account).call();
      setPendingReturn(Web3.utils.fromWei(returnsWei.toString(), 'ether'));

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
      await contract.methods.withdraw().send({ from: account });
      alert("Funds successfully withdrawn to your wallet!");
      fetchAuctionData();
    } catch (error) {
      console.error("Withdraw failed:", error);
      alert("Withdrawal failed. Check the console for details.");
    }
  };

  // --- NEW BLOCKCHAIN LEDGER LOGIC ---
  const handleViewLedger = async () => {
    setShowLedger(true);
    setIsLoadingLedger(true);
    try {
      // Query the blockchain for every 'HighestBidIncreased' event ever emitted by this contract
      const events = await contract.getPastEvents('HighestBidIncreased', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      // Map the raw blockchain data into a clean, readable format and reverse it (newest first)
      const history = events.map(event => ({
        bidder: event.returnValues.bidder,
        amount: Web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      })).reverse();

      setBidHistory(history);
    } catch (error) {
      console.error("Error fetching ledger events:", error);
    }
    setIsLoadingLedger(false);
  };

  if (isLoading) return <div className="p-8 text-stone-500 font-bold">Querying the blockchain...</div>;
  
  if (!account) return (
    <div className="p-8 max-w-6xl mx-auto text-center mt-12">
      <div className="bg-orange-50 border border-orange-200 text-orange-700 p-8 rounded-xl inline-block shadow-sm">
        <h2 className="text-xl font-bold mb-2">Wallet Disconnected</h2>
        <p>Please click <b>Connect Wallet</b> in the top navigation bar to view your active auctions and secure refunds.</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auctions Dashboard</h1>
          <p className="text-stone-500">Track live listings and manage your secure refunds.</p>
        </div>
        
        {/* Secure Withdrawal Panel */}
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
              <th className="p-4 font-medium">Blockchain Record</th>
            </tr>
          </thead>
          <tbody>
            {listing ? (
              <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                <td className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-200 rounded-lg overflow-hidden border border-stone-200 shadow-inner">
                     <img src="/wheat.jpg" alt="Crop" className={`w-full h-full object-cover ${listing.ended ? 'grayscale' : ''}`} />
                  </div>
                  <span className="font-bold text-stone-800 text-lg">{listing.cropType}</span>
                </td>
                <td className="p-4 font-mono font-bold text-agriGreen text-lg">
                  {listing.highestBid} ETH
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide shadow-sm ${
                    listing.ended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {listing.ended ? 'FINALIZED' : 'ACTIVE'}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={handleViewLedger}
                    className="bg-stone-100 border border-stone-200 text-stone-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white hover:border-agriGreen hover:text-agriGreen transition-all shadow-sm flex items-center gap-2"
                  >
                    <History className="w-4 h-4" /> View Ledger
                  </button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="4" className="p-12 text-center text-stone-500 font-medium">
                  No active listings found on the network.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LEDGER MODAL OVERLAY */}
      {showLedger && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
                  <History className="w-5 h-5 text-agriGreen" />
                  Immutable Bid Ledger
                </h2>
                <p className="text-sm text-stone-500 mt-1">Decentralized, unalterable record of all bids placed.</p>
              </div>
              <button 
                onClick={() => setShowLedger(false)} 
                className="text-stone-400 hover:text-stone-700 hover:bg-stone-200 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-stone-50/50 flex-1">
              {isLoadingLedger ? (
                <div className="text-center py-12 text-stone-500 font-medium animate-pulse">
                  Querying the blockchain for historical events...
                </div>
              ) : bidHistory.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="font-medium">No bids have been recorded on this smart contract yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bidHistory.map((bid, index) => (
                    <div key={index} className="flex justify-between items-center p-4 rounded-xl border border-stone-200 bg-white shadow-sm hover:border-agriGreen/40 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded font-bold">
                            Block {bid.blockNumber}
                          </span>
                          {index === 0 && (
                            <span className="bg-agriGreen/10 text-agriGreen text-xs px-2 py-0.5 rounded font-black tracking-wide">
                              CURRENT HIGHEST
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-sm font-medium text-stone-700">{bid.bidder}</p>
                        
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-1 cursor-not-allowed">
                          Tx Hash: {bid.transactionHash.substring(0, 16)}... 
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                      <div className={`font-black text-xl ${index === 0 ? 'text-agriGreen' : 'text-stone-500'}`}>
                        {bid.amount} ETH
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}