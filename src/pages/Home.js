import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import { Clock } from 'lucide-react';

export default function Home({ contract }) {
  const navigate = useNavigate();
  const [featuredListing, setFeaturedListing] = useState(null);

  useEffect(() => {
    if (contract) {
      loadFeaturedListing();
    }
  }, [contract]);

  const loadFeaturedListing = async () => {
    try {
      const sellerAddress = await contract.methods.seller().call();
      if (sellerAddress !== "0x0000000000000000000000000000000000000000") {
        const cropType = await contract.methods.cropDetails().call();
        const highestBidWei = await contract.methods.highestBid().call();
        
        setFeaturedListing({
          cropType: cropType,
          highestBid: Web3.utils.fromWei(highestBidWei.toString(), 'ether'),
        });
      }
    } catch (error) {
      console.error("Error reading featured listing:", error);
    }
  };

  return (
    <div>
      {/* BEAUTIFUL HERO BANNER */}
      {/* Uses the background image with a custom blend mode and gradient overlay */}
      <div 
        className="relative text-white px-12 py-28 overflow-hidden bg-agriGreen/90 bg-blend-multiply bg-cover bg-center shadow-inner"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      >
        <div className="max-w-2xl relative z-10 drop-shadow-lg">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">Decentralized Marketplace<br/>for Farmers</h1>
          <p className="mb-10 text-lg text-emerald-50 font-medium">Securely Trade Crops, Access Auctions, and Connect with Global Markets on the Blockchain.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-white text-agriGreen px-8 py-3 rounded-md font-bold shadow-lg hover:bg-stone-100 transition-transform hover:scale-105"
            >
              Explore Marketplace
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 text-white px-8 py-3 rounded-md font-bold shadow-lg hover:bg-orange-600 transition-transform hover:scale-105"
            >
              Create Listing
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex px-8 py-10 gap-8 max-w-screen-2xl mx-auto">
        
        {/* Sidebar Filters */}
        <div className="w-1/4">
          <h3 className="font-bold mb-4 text-xl">Filters</h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm text-stone-500 block mb-1">Crop Type</label>
              <select className="w-full p-3 border border-stone-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-agriGreen/20"><option>Wheat</option></select>
            </div>
            <div>
              <label className="text-sm text-stone-500 block mb-1">Location</label>
              <select className="w-full p-3 border border-stone-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-agriGreen/20"><option>Hapur, Uttar Pradesh</option></select>
            </div>
          </div>
        </div>

        {/* Featured Crops Grid */}
        <div className="w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-2xl">Featured crops</h3>
            <select className="p-2 border border-stone-200 rounded-lg bg-white text-sm shadow-sm"><option>All Features</option></select>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            
            {/* LIVE DYNAMIC CARD (Reads from Smart Contract) */}
            <div className="bg-white rounded-2xl shadow-md border border-stone-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="h-48 relative">
                <img src="/wheat.jpg" alt="Wheat Listing" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-black rounded-md shadow-md text-emerald-700 tracking-wide">
                  LIVE AUCTION
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-bold text-lg mb-1 truncate">{featuredListing ? featuredListing.cropType : "Premium Hard Red Wheat"}</h4>
                <p className="text-sm text-stone-500 mb-4 flex items-center gap-1">📍 Hapur, Uttar Pradesh</p>
                
                <div className="flex justify-between text-sm mb-5 pb-5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Current Bid:</span>
                  <span className="font-black text-right text-agriGreen text-base">
                    {featuredListing ? featuredListing.highestBid : "0.00"} ETH
                  </span>
                </div>
                
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => navigate('/marketplace')} className="flex-1 border-2 border-stone-200 hover:border-agriGreen hover:text-agriGreen text-stone-600 rounded-lg py-2 text-sm font-bold transition-colors">Details</button>
                  <button onClick={() => navigate('/marketplace')} className="flex-1 bg-agriGreen hover:bg-emerald-800 text-white rounded-lg py-2 text-sm font-bold shadow-md transition-colors">Place Bid</button>
                </div>
              </div>
            </div>

            {/* STATIC CARD 1: Rice */}
            <div className="bg-white rounded-2xl shadow-md border border-stone-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="h-48 relative">
                <img src="/rice.jpg" alt="Rice Listing" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-bold text-lg mb-1 truncate">Premium Basmati Rice</h4>
                <p className="text-sm text-stone-500 mb-4 flex items-center gap-1">📍 Karnal, Haryana</p>
                <div className="flex justify-between text-sm mb-5 pb-5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Current Bid:</span>
                  <span className="font-black text-right text-agriGreen text-base">0.120 ETH</span>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => navigate('/marketplace')} className="flex-1 border-2 border-stone-200 hover:border-agriGreen hover:text-agriGreen text-stone-600 rounded-lg py-2 text-sm font-bold transition-colors">Details</button>
                  <button onClick={() => navigate('/marketplace')} className="flex-1 bg-agriGreen hover:bg-emerald-800 text-white rounded-lg py-2 text-sm font-bold shadow-md transition-colors">Place Bid</button>
                </div>
              </div>
            </div>

            {/* STATIC CARD 2: Corn */}
            <div className="bg-white rounded-2xl shadow-md border border-stone-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="h-48 relative">
                <img src="/corn.jpg" alt="Corn Listing" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-bold text-lg mb-1 truncate">Yellow Dent Corn</h4>
                <p className="text-sm text-stone-500 mb-4 flex items-center gap-1">📍 Pune, Maharashtra</p>
                <div className="flex justify-between text-sm mb-5 pb-5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Current Bid:</span>
                  <span className="font-black text-right text-agriGreen text-base">0.085 ETH</span>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => navigate('/marketplace')} className="flex-1 border-2 border-stone-200 hover:border-agriGreen hover:text-agriGreen text-stone-600 rounded-lg py-2 text-sm font-bold transition-colors">Details</button>
                  <button onClick={() => navigate('/marketplace')} className="flex-1 bg-agriGreen hover:bg-emerald-800 text-white rounded-lg py-2 text-sm font-bold shadow-md transition-colors">Place Bid</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}