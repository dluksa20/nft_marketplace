import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Option "mo:base/Option";
import Iter "mo:base/Iter";
import Prelude "mo:base/Prelude";

persistent actor OpenNFT {

    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;
    };

    transient var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    transient var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
    transient var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text) : async Principal {
        let owner : Principal = msg.caller;

        Debug.print("Minting NFT for: " # Principal.toText(owner));
        Debug.print("Available cycles before mint: " # debug_show(Cycles.balance()));

        Cycles.add(1_400_000_000_000); // Add cycles for new NFT canister
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);

        Debug.print("Available cycles after mint: " # debug_show(Cycles.balance()));

        let newNFTPrincipal = Principal.fromActor(newNFT);

        mapOfNFTs.put(newNFTPrincipal, newNFT);
        addToOwnershipMap(owner, newNFTPrincipal);

        return newNFTPrincipal;
    };

    private func addToOwnershipMap(owner: Principal, nftId: Principal) {
        var ownedNFTs = switch (mapOfOwners.get(owner)) {
            case null { List.nil<Principal>() };
            case (?existing) { existing };
        };
        ownedNFTs := List.push(nftId, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

    public query func getOwnedNFTs(user: Principal) : async [Principal] {
        let userNFTs = switch (mapOfOwners.get(user)) {
            case null { List.nil<Principal>() };
            case (?owned) { owned };
        };
        return List.toArray(userNFTs);
    };

    public query func getListedNFTs() : async [Principal] {
        let ids = Iter.toArray(mapOfListings.keys());
        return ids;
    };



    public shared(msg) func listItem(id: Principal, price: Nat) : async Text {
        let item : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null { return "NFT does not exist." };
            case (?nft) { nft };
        };

        let owner = await item.getOwner();
        if (Principal.equal(owner, msg.caller)) {
            let newListing : Listing = {
                itemOwner = owner;
                itemPrice = price;
            };
            mapOfListings.put(id, newListing);
            return "Success";
        } else {
            return "Error: You do not own this NFT.";
        }
    };




    public shared(msg) func unlistItem(id: Principal) : async Text {
        switch (mapOfListings.get(id)) {
            case null { return "Item is not listed."; };
            case (?listing) {
                if (Principal.equal(listing.itemOwner, msg.caller)) {
                    mapOfListings.delete(id);
                    return "Item unlisted successfully.";
                } else {
                    return "Only the owner can unlist the item.";
                }
            };
        }
    };

    public query func getOpenNFTCanisterID() : async Principal {
        return Principal.fromActor(OpenNFT);
    };

    public query func isListed(id: Principal) : async Bool {
        return Option.isSome(mapOfListings.get(id));
    };

    public query func getOriginalOwner(id: Principal) : async Principal {
        var listing : Listing = switch (mapOfListings.get(id)){
            case null return Principal.fromText("");
            case (?result) result;
        };
        return listing.itemOwner;
    };

    public query func getListedNFTPrice(id: Principal) : async Nat {
        var listing : Listing = switch (mapOfListings.get(id)){
            case null { return 0 };
            case (?result) result;
        };

        return listing.itemPrice;
    };

    public shared(msg) func completePurchase(id: Principal, ownerId: Principal, newOwnerID: Principal) : async Text {

        var purchasedNFT : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist!";
            case (?result) result;
        };
        let transferResult = await purchasedNFT.transferOwnership(newOwnerID);

        if (transferResult == "Success") {
            mapOfListings.delete(id);
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)) {
                case null List.nil<Principal>();
                case (?result) result;
            };
            ownedNFTs := List.filter(ownedNFTs, func (listItemId: Principal): Bool {
                return listItemId != id;
            });
            addToOwnershipMap(newOwnerID, id);
            return "Success";
        } else {
            return transferResult;
        }
        
        
    }
};
