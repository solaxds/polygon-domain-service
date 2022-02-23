// SPDX-License-Identifier: UNLICENSED

// We first import some OpenZeppelin Contracts
// Then we 'inherit' them using ERC721URIStorage when we delcare the domains smart contract
// Basically it means we can call other smart contracts from ours - like importing functions for us to use
// OpenZeppelin essentially implements the NFT standard for us (contd. below)
// And then lets us write our own logic on top of it to customize it (i.e. no writing boilerplate code)
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// State the version of the Solidity compiler that you want your smart contract to us
// It's essentially saying (contd. below):
// "When running this, I only want to use version 0.8.10 of the Solidity compiter. Nothing lower.
pragma solidity ^0.8.10;

// Don't forget to include the following import
// Strings in Solidity are weird, so we need a custom function to check their length
// This function converts them to bytes first, making it much more gas-efficient
import { StringUtils } from "../contracts/libraries/StringUtils.sol";

// We import another help function
// This helps us convert the SVG used for our NFT image (contd. below)
// And the JSON for its metadata, into Base64 in Solidity
import {Base64} from "./libraries/Base64.sol";

// Some magic given by Hardhat in order to do some console log in our smart contract
import "hardhat/console.sol";

// ##

// One of the coolest things added in a recent version of Solidity (contd. below)
// Is the ability to use custom error messages
// This is useful because you no longer have to repeated error message string
// Also, they help us save on gas fees when deploying the smart contract to the blockchain
error Unauthorized();
error AlreadyRegistered();
error InvalidName(string name);

// ##

// Smart contracts kinda look like a class in other programming languages
// Once I initialze this smart contract for the first time (contd. below)
// The constructor (Line: 116) will run and print out the console.log

// We need to create a function for people to hit, so that they can register their domain
// And a place to store their names
// We inherit the contract we imported
// This means that we'll have access to the inherited contract's methods
contract Domains is ERC721URIStorage {
    // Magic given to us by OpenZeppelin to help us keep track of tokenIds
    using Counters for Counters.Counter;
    // We're going to be using '_tokenIds' to keep track of the NFTs unique identifier
    // It's a number that's automatically initialized to 0 when we declare 'private _tokenIds'
    Counters.Counter private _tokenIds;

    // Here is out TLD (top-level domain), similar to .eth
    // This will record what your domain ends with
    string public tld;

    // We'll be storing our NFT images on-chain, as SVGs
    // An SVG is am image that is built with code
    string svgPartOne = 
        '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949a4.382 4.382 0 0 0-4.394 0l-10.081 6.032-6.85 3.934-10.081 6.032a4.382 4.382 0 0 1-4.394 0l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616 4.54 4.54 0 0 1-.608-2.187v-9.31a4.27 4.27 0 0 1 .572-2.208 4.25 4.25 0 0 1 1.625-1.595l7.884-4.59a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v6.032l6.85-4.065v-6.032a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595L41.456 24.59a4.382 4.382 0 0 0-4.394 0l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595 4.273 4.273 0 0 0-.572 2.208v17.441a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l10.081-5.901 6.85-4.065 10.081-5.901a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v9.311a4.27 4.27 0 0 1-.572 2.208 4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721a4.382 4.382 0 0 1-4.394 0l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616 4.53 4.53 0 0 1-.608-2.187v-6.032l-6.85 4.065v6.032a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l14.864-8.655a4.545 4.545 0 0 0 2.198-3.803V55.538a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="a" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#F9E3B0"/><stop offset="1" stop-color="#B4BAEC" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#b)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    string svgPartTwo = '</text></svg>';

    // Add a 'mapping' data type to store their names
    mapping(string => address) public domains;

    // Think about it like this: it is your domain's DNS settings
    // Similar to how you can go to Namecheap, GoDaddy etc and customize the DNS records associated with a domain
    // This is the same thing - we're building our DNS record system

    // With ENS, you can store a bunch of different things
    // To complete the 'Name Swervice' part of our app, we're going to add records to each domain
    // This means we'll connect each name to a value, sorta like a database
    // These values can be anything - wallet addresses, secret encrypted messages, URLs etc

    // Our new mapping will store values:
    mapping(string => string) public records;

    // mapping(string => string) public imageUrl;
    
    // mapping(string => string) public spotifyUrl;

    // mapping(string => string) public userName;

    mapping (uint => string) public names;

    // Add this anywhere in within the smart contract body
    function getAllNames() public view returns (string[] memory) {
        console.log("Getting all names from contract");
        string[] memory allNames = new string[](_tokenIds.current());
        for (uint i = 0; i < _tokenIds.current(); i++) {
            allNames[i] = names[i];
            console.log("Name for token %d is %s", i, allNames[i]);
        }
        
        return allNames;

        // What we've done is added a mapping to store mint ID's with domain names
        // We've also added a 'pure' function to iterate through those names
        // And then put them in a list to send to us
    }

    /* {{ DEFUNCT }}
    constructor() {
        console.log("This is my domains smart contract. Awesome!");
    }
    */

    // Create a global owner variable
    address payable public owner;

    // We make the contract 'payable' by adding this to the constructor
    // This is how we're setting the public tld variable
    constructor(string memory _tld) payable ERC721("Vibes Domain Service", "VDS") {
        // Set the owner in the constructor, as well
        owner = payable(msg.sender);
        tld = _tld;
        console.log("%s domain service deployed", _tld);
    }

    // This function will give us the price of a domain, based on its length
    // The price function is a pure function: meaning it does not read or modify contract state
    // It's just a helper
    // We could technically do this on the frontend using JavaScript, but it wouldn't be as secure
    // Here, we're calculating the final price on-chain
    function price(string calldata name) public pure returns(uint) {
        uint len = StringUtils.strlen(name);
        require(len > 0);
        if (len == 1) {
            // 5 $MATIC = 5 000 000 000 000 000 000 (18 decimals)
            // We'll use 0.5 $MATIC since Polygon faucet doesn't give a lot
            return 5 * 10**17;
        } else if (len == 4) {
            // To charge smaller amounts, reduce the decimals
            // This is 0.3
            return 3 * 10**17;
        } else {
            return 1 * 10**17;
        }
    }


    // We create a 'register' function that adds their names to our mapping
    function register(string calldata name) public payable {
        // Check that the domain name is NOT yet registered to a wallet address
        // This 'require' statement stops other people from taking your domain
        // Here, we're checking that the address of the domain you're truing to register is the same as the zero address
        // The zero address in Solidity is sort of like the void where everything comes from
        // When an address mapping is initialized, all entries in it point to the zero address
        // So if a domain has NOT been resgietered yet, it'll point to the zero address
        // require(domains[name] == address(0)); {{ DEFUNCT }}

        // Reference custom Solidity error codes (see Lines: 35 - 37)
        if (domains[name] != address(0)) revert AlreadyRegistered();
        if (!valid(name)) revert InvalidName(name);

        uint256 _price = price(name);

        // Check if enough $MATIC was paid in the transaction
        // Here, we check if the value of the 'msg' sent is above a certain amount
        // 'value' is the amount of $MATIC sent
        // 'msg' is the transaction
        require(msg.value >= _price, "Not enough $MATIC paid");

        // Add the 'domains' mapping variable (from Line: 67)
        // A mapping is a simple datatype that 'maps' (or matches) two values
        // In our case, we're mapping a string (domain name) to a wallet address
        domains[name] = msg.sender;
        console.log("%s has registered a domain!", msg.sender);

        // Combine the name passed into the function, with the TLD
        string memory _name = string(abi.encodePacked(name, ".", tld));

        // Create the SVG (image) for the NFT with the name (see: Line 62)
        // In other words, we're creating an SVG based on our domain
        // So we split the SVG into 2 and put our domain in-between those two parts
        // We use the 'encodePacked' function to turn a bunch of strings into byes, which then combines them
        // This is because you can't combine strings directly in Solidity
        string memory finalSvg = string(abi.encodePacked(svgPartOne, _name, svgPartTwo));
        uint256 newRecordId = _tokenIds.current();
        uint256 length = StringUtils.strlen(name);
        string memory strLen = Strings.toString(length);

        console.log("Registering %s on the contract with tokenID %d", name, newRecordId);

        // Next, we create the JSON metadata of our NFT
        // And we do this by combining strings and encoding as base64
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        _name,
                        '", "description": "A domain on the Vibes Domain Service", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(finalSvg)),
                        '","length":"',
                        strLen,
                        '"}'
                    )
                )
            )
        );

        string memory finalTokenUri = string( abi.encodePacked("data:application/json;base64,", json));

            console.log("\n--------------------------------------------------------");
        console.log("Final tokenURI", finalTokenUri);
        console.log("--------------------------------------------------------\n");

        // (Lines 215 and 218) below are the magical lines that actually create our NFT

        // Mint the NFT to newRecord
        _safeMint(msg.sender, newRecordId);

        // Set the NFTs data -- in this case, the JSON blob w/ our domain's info
        _setTokenURI(newRecordId, finalTokenUri);
        domains[name] = msg.sender;

        // This final piece is what will allow us to retrieve the minted domains on our contract
        // Ref. (Lines 90 - 98) above
        names[newRecordId] = name;

        _tokenIds.increment();

        // Notes ##

        // 'json' NFTs use JSON to store details like the name, description, attributes, and the media
        // What we're doing with json is comining strings with abi.encodePacked, to make a JSON object
        // We're then encoding it as a Base64 string, before setting it as the token URI

        // '_tokenIds' is an object that lets us access and set our NFTs unique token number
        // Each NFT has a unique id - and this helps us make sure of that

        
        // The 'domain' variable is special because it's called a 'state variable' (contd. below)
        // And it is stored permanently in the contract's storage
        // Meaning: anyone who calls the register function (see Line: 146), will permanently store data related to their domain, right in our smart contract

        // {{ 'msg.sender' }} is the wallet address of the person who called the function
        // It's like built-in authentication - and so we know exactly who called the function because (contd. below)
        // In order to even calla smart contract function, you need to sign the transaction with a valid wallet
        // You can also write functions that only certain wallet address can hit
        // E.g. So that only wallets that own domains, can update them

        // The getAddress function (see Line: 264) below does exactly that
        // It gets the wallet address of a domain owner
    }

    // Currently, we're checking if a domain is valid, using JavaScript in our React dApp
    // But this isn't really the most secure approach (contd. below)
    // Since someone can interact with our contract directly, to mint an invalid domain
    // As such, it makes more sense to run these checks on our smaert contract

    function valid(string calldata name) public pure returns(bool) {
        return StringUtils.strlen(name) >= 1 && StringUtils.strlen(name) <= 8;
    }

    // In the function above, we're checking if the domain name is between 1-8 characters
    // This helps to keep domain names short and clean

    // This function will then give us the domain owner's address
    function getAddress(string calldata name) public view returns (address) {
        // Check that the owner is the transaction sender
        return domains[name];

        // 'calldata' - indicates the 'location' of where the name argument should be stored (contd. below)
        // Since it costs real money to process data on the blockcain, Solidity lets you indicate where reference types should be stored
        // 'calldata' is non-persistent and cannot be modified - which is good because it takes the least amount of gas

        // 'public' - a visibility modifier. We want our function to be accessible by everyone, including other smart contracts
        // 'view' - this just means that the function is only viewing data on the contract. It is NOT modifying it
        // 'returns (string)' - the smart contract returns a string variable when called

        // We deploy our smart contract to the blochain via 'domainContractFactory.deploy()' (see Line: 18) in our 'deploy.js' file (contd. below)
        // And when we do this, our functions become available to be called on the blockchain
        // This is because we used that special 'public' keyword in our {{ getAddress }} function above (see Line: 264)
        // Think of this like a public API endpoint

        // Now that we have some functions to called, we can use run.js to manually test them out
        // Remember, run.js is our playground
    }

    function setRecord(string calldata name, string calldata record) 
        public 
    {
        // Check that the owner is the transaction sender
        // This 'require' statement stops other people from changing the record
        // Here, we're checking that the transaction sender is the address that owns the domain
        // We don't want to let anyone set our domain records
        require(domains[name] == msg.sender);

        /* Reference custom Solidity error codes (see Lines: 35 - 37) --  {{ DEFUNCT }}
        if (msg.sender != domains[name]) revert Unauthorized();
        */
        records[name] = record;
    }

    function getRecord(string calldata name) 
        public view 
        returns(string memory) 
    {
        return records[name];
    }

    /* {{ DEFUNCT }}
    // Ref. mapping above, at (Line: 81)
    function setImage(string calldata name, string calldata link) 
        public 
    {
        imageUrl[name] = link;
    }

    function getImage(string calldata name) 
        public view 
        returns(string memory) 
    {
        return imageUrl[name];
    }

    // Ref. mapping above, at (Line: 83)
    function setMusic(string calldata name, string calldata link) 
        public 
    {
        spotifyUrl[name] = link;
    }

    function getMusic(string calldata name) 
        public view
        returns(string memory)
    {
        return spotifyUrl[name];
    }

    // Ref. mapping above, at (Line: 85)
    function setName(string calldata name, string calldata user) 
        public 
    {
        userName[name] = user;
    }

    function getName(string calldata name) 
        public view 
        returns(string memory) 
    {
        return userName[name];
    }
    */

    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    function withdraw() public onlyOwner {
        uint amount = address(this).balance;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw $MATIC");
    }
}