import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

persistent actor class NFT(name: Text, owner: Principal, content: [Nat8]) = this {

    private stable let itemName = name;
    private stable var nftOwner = owner;
    private stable let imageBytes = content;

    public query func getName() : async Text {
        return itemName;
    };

    public query func getOwner() : async Principal {
        return nftOwner;
    };

    public query func getAsset() : async [Nat8] {
        return imageBytes;
    };

    public query func getCanisterId() : async Principal {
        return Principal.fromActor(this);
    };

    public shared(msg) func transferOwnership(newOwner: Principal) : async Text {
        Debug.print("=== TRANSFER OWNERSHIP ===");
        Debug.print("Caller         : " # Principal.toText(msg.caller));
        Debug.print("Current Owner  : " # Principal.toText(nftOwner));
        Debug.print("New Owner      : " # Principal.toText(newOwner));

        if (msg.caller == nftOwner) {
            nftOwner := newOwner;
            Debug.print("Ownership transferred to: " # Principal.toText(newOwner));
            return "Success";
        } else {
            return "Error: Not initiated by NFT owner!";
        }
    };
};
