import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import { Clock } from 'lucide-react';

export default function Home({ contract }) {
  const navigate = useNavigate();
  const [featuredListing, setFeaturedListing] = useState(null);

  // Fetch the latest listing to display on the Home Page
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
      {/* Hero Banner */}
      <div className="bg-agriGreen text-white px-12 py-16 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <h1 className="text-4xl font-bold mb-4">Decentralized Marketplace<br/>for Farmers</h1>
          <p className="mb-8 text-emerald-100">Securely Trade Crops, Access Auctions, and Connect with Global Markets on the Blockchain.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-white text-agriGreen px-6 py-2 rounded-md font-bold hover:bg-stone-100 transition-colors"
            >
              Explore Marketplace
            </button>
            <button 
              onClick={() => navigate('/marketplace')}
              className="border border-white px-6 py-2 rounded-md font-medium hover:bg-emerald-800 transition-colors"
            >
              Learn More
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 text-white px-6 py-2 rounded-md font-bold shadow-lg hover:bg-orange-600 transition-colors"
            >
              Create Listing
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex px-8 py-8 gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-1/4">
          <h3 className="font-bold mb-4">Filters</h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm text-stone-500 block mb-1">Crop Type</label>
              <select className="w-full p-2 border rounded-md bg-white"><option>Wheat</option></select>
            </div>
            <div>
              <label className="text-sm text-stone-500 block mb-1">Location</label>
              <select className="w-full p-2 border rounded-md bg-white"><option>Hapur, Uttar Pradesh</option></select>
            </div>
          </div>
        </div>

        {/* Featured Crops Grid */}
        <div className="w-3/4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl">Featured crops</h3>
            <select className="p-1 border rounded-md bg-white text-sm"><option>All Features</option></select>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Dynamic Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
              <div className="h-32 bg-stone-200 rounded-lg mb-4 overflow-hidden relative">
                <div className="absolute top-2 left-2 bg-white px-2 py-1 text-xs font-bold rounded shadow-sm text-stone-600">LIVE</div>
              </div>
              <h4 className="font-bold truncate">{featuredListing ? featuredListing.cropType : "Premium Hard Red Wheat"}</h4>
              <p className="text-sm text-stone-500 mb-4">📍 Hapur, Uttar Pradesh</p>
              
              <div className="flex justify-between text-sm mb-4 border-t pt-4">
                <span className="text-stone-500">Current Bid:</span>
                <span className="font-bold text-right text-agriGreen">
                  {featuredListing ? featuredListing.highestBid : "0.00"} ETH
                </span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="flex-1 border border-stone-300 hover:border-agriGreen hover:text-agriGreen rounded-md py-2 text-sm font-medium transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="flex-1 bg-agriGreen hover:bg-emerald-800 text-white rounded-md py-2 text-sm font-medium transition-colors"
                >
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}