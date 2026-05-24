import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Web3 from 'web3';
import { Sprout, Wallet } from 'lucide-react';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Auctions from './pages/Auctions';
import AgriAuctionABI from './AgriAuction.json'; 

export default function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);

  useEffect(() => {
    initWeb3();
  }, []);

  const initWeb3 = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      
      try {
        const netId = await web3.eth.net.getId();
        const deployedNetwork = AgriAuctionABI.networks[netId];
        
        if (deployedNetwork) {
          const instance = new web3.eth.Contract(
            AgriAuctionABI.abi,
            deployedNetwork.address
          );
          setContract(instance);
        } else {
          console.error("Smart contract not deployed to detected network.");
        }
      } catch (error) {
        console.error("Error initializing Web3", error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Wallet connection denied", error);
      }
    } else {
      alert("Please install MetaMask to use this dApp!");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] font-sans text-stone-800">
      {/* Global Navigation */}
      <nav className="bg-white px-8 py-4 flex justify-between items-center shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <Sprout className="text-agriGreen w-8 h-8" />
          <span className="text-xl font-bold text-stone-800">AgriCrop<br/><span className="text-sm font-normal text-stone-500">Connected Hub</span></span>
        </Link>
        <div className="flex gap-6 font-medium text-stone-600">
          <Link to="/marketplace" className="hover:text-agriGreen">Marketplace</Link>
          <Link to="/auctions" className="hover:text-agriGreen">Auctions</Link>
          <Link to="/dashboard" className="hover:text-agriGreen">Dashboard</Link>
        </div>
        <button 
          onClick={connectWallet}
          className="bg-agriGreen text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-emerald-800 transition-colors"
        >
          <Wallet className="w-4 h-4" />
          {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Connect Wallet'}
        </button>
      </nav>

      {/* Page Routing */}
      <Routes>
        <Route path="/" element={<Home contract={contract} />} />
        <Route path="/marketplace" element={<Marketplace account={account} contract={contract} />} />
        <Route path="/auctions" element={<Auctions account={account} contract={contract} />} />
        <Route path="/dashboard" element={<Dashboard account={account} contract={contract} />} />
      </Routes>
    </div>
  );
}