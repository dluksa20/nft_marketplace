import React, { useEffect, useState } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, nft } from "../../../declarations/nft";
import { Principal } from "@dfinity/principal";
import Button from "./Button";
import { openNFT_backend } from "../../../declarations/openNFT_backend";
import CURRENT_USER_ID from "../main";
import PriceLabel from "./PriceLabel";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token_backend";


function Item(props) {

  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState();
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setDisplay] = useState(true)
  const id = props.id;
  
  
  let NFTActor;

  async function getAgent() {
  const agent = new HttpAgent({ host: "http://localhost:3000" }); 

  if (process.env.DFX_NETWORK !== "ic") {
    // console.log("Fetching root key...");
    await agent.fetchRootKey();
    // console.log("Root key fetched");
  }

  return agent;
}

  

  async function loadNFT() {
    const agent = await getAgent();
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id})
    

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();

    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}));

    setName(name);
    setOwner(owner.toText());
    setImage(image);

    if (props.role == 'collection') {
      const nftIsListed = await openNFT_backend.isListed(props.id);
      if (nftIsListed) {
        setOwner("OpenNFT");
        setBlur({filter: "blur(4px)"});
        setSellStatus("Listed")
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"}/>);
      }
    } else if (props.role == 'discover'){
        const originalOwner = await openNFT_backend.getOriginalOwner(props.id);
        if (originalOwner.toText() != CURRENT_USER_ID.toText()){
          setButton(<Button handleClick={handleBuy} text={"Buy"}/>);
        };

        const price = await openNFT_backend.getListedNFTPrice(props.id);
        setPriceLabel(<PriceLabel sellPrice={price.toString()}/>)

    };
  };

  useEffect(() => {
    loadNFT();
  }, []);



  let price;
  function handleSell(){
    console.log('Sell is Clicked');
    setPriceInput(<input 
      placeholder="Price in DLUK"
      type="number"
      className="price-input"
      value={price}
      onChange={(e) => price = e.target.value}
    />);

    setButton(<Button handleClick={sellItem} text={"Confirm"}/>);
  };
  

  async function handleBuy() {
    console.log("Buy was triggered!");
    setLoaderHidden(false) 
    const agent = await getAgent();
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("ucwa4-rx777-77774-qaada-cai"),
    });

    const sellerId = await openNFT_backend.getOriginalOwner(props.id);
    const itemPrice = await openNFT_backend.getListedNFTPrice(props.id);
    console.log(sellerId);
    console.log(itemPrice);
    
    

    const result = await tokenActor.transfer(sellerId, itemPrice);
    console.log(result);

    if (result == "Success") {
      const transferResult = await openNFT_backend.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log(`Purchase was ${transferResult}`);
      
    }
    
    setLoaderHidden(true);
    setDisplay(false);
  };




  async function sellItem() {
    setBlur({
      filter: "blur(4px)"
    })
    setLoaderHidden(false)
    console.log(`Set price: ${price}`);
    const listingResult = await openNFT_backend.listItem(props.id,  Number(price));
    console.log("Listing: " + listingResult);


    if (listingResult == "Success"){
      const openNFTId = await openNFT_backend.getOpenNFTCanisterID();
      const transferResult = await NFTActor.transferOwnership(openNFTId);
      console.log("Transfer: " + transferResult);
      if (transferResult == "Success") {
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenNFT");
        setSellStatus("Listed");
      }
    }
    
  }
  


  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />

        {/* Loader */}
        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>


        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  )
}
export default Item;
