// Our 'run.js' file is our playground to mess around with our smart contract

// Line ref. are not updated in this file because this run.js is solely for localized testing
// Refer to comments left on smart contract and deploy.js for clarity

const main = async () => {
    // In order to deploy something to the blockchain, we need to have a wallet address
    const [owner, superCoder] = await hre.ethers.getSigners();

    // This will compile the smart contract
    // And generate the necessary files that you need to work with
    // It will be listed under the 'artifacts' directory
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');

    // Hardhat will create a localized Ethereum network - but ONLY for this contract
    // After the script completes, it will destroy that local network
    // So every time we run this smart contract, it will be a fresh blockchain
    // The point of this process, is so that you we always start with a clean slate (contd. below)
    // Thus making it easier to debug any error
    // I want the end of all registered domains to be .vibes
    // Therefore, we pass in our 'domain name' (e.g. eth) to the constructor when deploying
    // We need to pass 'vibes' to our deploy function to our initial tld property
    // Ref. (Line: 57) in our Domains.sol file
    const domainContract = await domainContractFactory.deploy("vibes");

    // Hardhat creates fake miners on your computer
    // This is to try and imitate the conditions of the actual blockchain (mainnet)
    // Thus in the line below, we'll wait until our smart contract is officially mined and deployed
    await domainContract.deployed();

    // Our 'constructor' runs when we actually are fully deployed
    // see (Line: 15) in our Domains.sol file
    // Once it's deployed - 'domainContract.address' will give us the address of the deployed smart contract
    // This address is how we can actually find our contract on the blockchain
    // console.log("Contract deployed to:", domainContract.address); {{ DEFUNCT }}

    console.log("Contract owner:", owner.address);

    // Before you run the command below (see Line: 32) in terminal, check the solidity version in 'hardhat.config.js'
    // Next, open up your terminal and run: npx hardhat run scripts/run.js
    // You should then see your console.log run from within the Domains.sol smart contract (see Line: 16)
    // You should also see the smart contract address displayed


    // ## NOTE: In the code above, we use 'hre.ethers', but it's never imported anywhere
    // Info. via 'hardhat.org' (contd. below)
    // "The Hardhat Runtime Environment, or HRE for short, is an object containing all the
    // functionality that Hardhat exposes when running a task, test or script.
    // In reality, Hardhat is the HRE."

    // Thus, every time I run a terminal command that begins with 'npx hardhat' (contd. below)
    // You are getting this 'hre' object being built on the fly, using the 'hardhat.config.js' specified in your code
    // This means you will never have to actually do some sort of import into your files (e.g. const hardhat = require("hardhat"))
    
    /* {{ DEFUNCT }}
    Add in the following code to see the address of the person deploying our contract
    console.log("Contract deployed by:", owner.address);
    */

    // Now let's manually call our new functions in our 'Domains.sol' smart contract (see Lines: 84 & 122)
    // 1) I call the function to register the name 'pure'
    // To register a domain, we need to actually call our 'register' function
    // And this takes 2 arguments (contd. below):
    // i) The domain you want to register
    // ii) The price of the domain (including gas fees) in $MATIC
    // We're passing in a second variable: called 'value' (this is the monies!)
    // Let's be extra generous with our payment (we're paying more than required)
    let txn = await domainContract.register("a16z", {value: hre.ethers.utils.parseEther('1234')});
    await txn.wait();

    // We used a special 'parseEther' function above (see Line: 63) because units work different in Solidity
    // This will send 0.1 $MATIC from my wallet, to the contract as payment
    // Once this occurs, the domain will be minted to my wallet address

    // 2) Then I call the 'getAddress' function to return the owner of that domain
    // Simple!
    const address = await domainContract.getAddress("pure");
    console.log("Owner of domain pure:", address);

    /* {{ DEFUNCT }}
    // Trying to set a record that doesn't belong to me!
    // Running this script should give an error, because we're trying to set a record for a domain that doesn't belong to us
    // This is how we can test to know whether or not our require statements work (see Lines: 45 & 94 - in Domains.sol)
    // txn = await domainContract.connect(randomPerson).setRecord("doom", "Haha this is my domain now!");
    // await txn.wait();
    */

    // \\

    // 1) Next, you need to call the 'setting' mapping functions from our Domains.sol smart contract
    // Ref. (Lines: 115, 129, 143)

    // 2) And then finally, you call the 'get' mapping functions from our Domain.sol smart contract
    // Ref. (Lines: 121, 135, 149)

    const settingImage = await domainContract.setImage("pure", "https://i.imgur.com/Xzbgx68.jpeg");
    await settingImage.wait();

    const imageSet = await domainContract.getImage("pure");
    console.log("image set by pure:", imageSet);

    // ##
    
    const settingMusic = await domainContract.setMusic("pure", "https://open.spotify.com/track/13LrJDJhegSLCZzqd5InmU?si=bbf19260d9ec4481");
    await settingMusic.wait();

    const musicSet = await domainContract.getMusic("pure");
    console.log("music set by pure", musicSet);

    // ##
    
    const settingName = await domainContract.setName("pure", "Sola");
    await settingName.wait();

    const nameSet = await domainContract.getName("pure");
    console.log("Name:", nameSet);

    // How much money is in here
    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract balance:", hre.ethers.utils.formatEther(balance));

    // Quick! Grab the funds from the contract (as superCoder)
    try {
        txn = await domainContract.connect(superCoder).withdraw();
        await txn.wait();
    } catch(error) {
        console.log("Could not rob contract");
    }

    // Let's look in their wallet, so we can compare later
    let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    console.log("Balance of owner before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));

    // Oops, looks like the owner is saving their money!
    txn = await domainContract.connect(owner).withdraw();
    await txn.wait();

    // Fetch balance of contract & owner
    const contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    ownerBalance = await hre.ethers.provider.getBalance(owner.address);

    console.log("Contract balance after withdrawal:", hre.ethers.utils.formatEther(contractBalance));
    console.log("Balance of owner after withdrawal:", hre.ethers.utils.formatEther(ownerBalance));
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runMain();