import React, { useEffect, useState } from "react";
import logo from "../public/logo.png";
import { BrowserRouter, Link, Routes, Route } from "react-router-dom";
import homeImage from "../public/home-img.png";
import Minter from "./Minter";
import Gallery from "./Gallery";
import { openNFT_backend } from "../../../declarations/openNFT_backend";
import CURRENT_USER_ID from "../main";



function Header() {

  const [userOwnedGallery, setOwnedGallery] = useState();
  const [listingGallery, setListingGallery] = useState();

  async function getNFTs() {
    const userNFTIds = await openNFT_backend.getOwnedNFTs(CURRENT_USER_ID)
    setOwnedGallery(<Gallery title="My NFTs" ids = {userNFTIds} role="collection"/>);
    const listedNFTIds = await openNFT_backend.getListedNFTs();
    console.log(listedNFTIds);
    setListingGallery(<Gallery title="Discover" ids={listedNFTIds} role="discover" />)
  };
  useEffect(() => {
    getNFTs();
  }, [])
  // console.log(userOwnedGallery);
  

  return (
  <BrowserRouter forceRefresh={true}>
    <div className="app-root-1">
      <header className="Paper-root AppBar-root AppBar-positionStatic AppBar-colorPrimary Paper-elevation4">
        <div className="Toolbar-root Toolbar-regular header-appBar-13 Toolbar-gutters">
          <div className="header-left-4"></div>
          <img className="header-logo-11" src={logo} alt="Logo" />
          <div className="header-vertical-9"></div>
          
          <Link to="/">
            <h5 className="Typography-root header-logo-text">OpenD</h5>
          </Link>
          
          <div className="header-empty-6"></div>
          <div className="header-space-8"></div>
          
          <Link to="/discover" className="ButtonBase-root Button-root Button-text header-navButtons-3"
          onClick={() => window.location.href = "/discover"}>
            Discover
          </Link>
          <Link to="/minter" className="ButtonBase-root Button-root Button-text header-navButtons-3">
            Minter
          </Link>
          <Link to="/collection" className="ButtonBase-root Button-root Button-text header-navButtons-3"
          onClick={() => window.location.href = "/collection"}>
            My NFT
          </Link>
        </div>
      </header>
    </div>

    <Routes>
      <Route exact path="/" element={<img className="bottom-space" src={homeImage} alt="" />} />
      <Route path="/discover" element={listingGallery ?? <h2>Loading your NFTs...</h2>} />
      <Route path="/minter" element={<Minter />} />
      <Route path="/collection" element={userOwnedGallery ?? <h2>Loading your NFTs...</h2>} />
    </Routes>
  </BrowserRouter>
);
}

export default Header;
