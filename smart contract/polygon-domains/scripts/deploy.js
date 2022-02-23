// Our 'deploy.js' file is how we'll deploy to Polygon's Mumbai testnet

const main = async () => {
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
    // Ref. (Line: 58) in our Domains.sol file
    const domainContract = await domainContractFactory.deploy("vibes");

    // Hardhat creates fake miners on your computer
    // This is to try and imitate the conditions of the actual blockchain (mainnet)
    // Thus in the line below, we'll wait until our smart contract is officially mined and deployed
    await domainContract.deployed();

    // Our 'constructor' runs when we actually are fully deployed
    // see (Line: 116) in our Domains.sol file
    // Once it is deployed - 'domainContract.address' will give us the address of the deployed smart contract
    // This address is how we can actually find our contract on the blockchain
    console.log("Contract deployed to:", domainContract.address);


    // Before you run the command below (see Line: 33) in terminal, check the solidity version in 'hardhat.config.js'
    // Next, open up your terminal and run: 'npx hardhat run scripts/run.js'
    // You should then see your console.log run from within the Domains.sol smart contract
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

    // Now let's manually call our new functions in our 'Domains.sol' smart contract (see Lines: 146 & 264)
    // 1) I call the function to register the name '🍃'
    // To register a domain, we need to actually call our 'register' function
    // And this takes 2 arguments (contd. below):
    // i) The domain you want to register
    // ii) The price of the domain (including gas fees) in $MATIC
    // We're passing in a second variable: called 'value' (this is the monies!)
    let txn = await domainContract.register("🍃", {value: hre.ethers.utils.parseEther('0.5')});
    // let txn = await domainContract.register("good", {gasPrice:'1'});
    await txn.wait();
    console.log("Minted domain 🍃.vibes");

    txn = await domainContract.setRecord("🍃", "leafy");
    await txn.wait();
    console.log("Set record for 🍃.vibes");

    // We used a special 'parseEther' function (see Line: 60) above because units work differently in Solidity
    // This will send 0.1 $MATIC from my wallet, to the contract as payment
    // Once this occurs, the domain will be minted to my wallet address

    // 2) Then I call the 'getAddress' function to return the owner of that domain
    // Simple!
    const address = await domainContract.getAddress("🍃");
    console.log("Owner of domain 🍃:", address);

    // 1) Next, you need to call the 'setting' mapping functions from our Domains.sol smart contract
    // Ref. (Lines: 307, 321, 335) -- {{ DEFUNCT }}

    // 2) And then finally, you call the 'get' mapping functions from our Domain.sol smart contract
    // Ref. (Lines: 313, 327, 341) -- {{ DEFUNCT }}

    {/** {{ DEFUNCT }}
    const settingImage = await domainContract.setImage("good", "https://i.imgur.com/Xzbgx68.jpeg");
    await settingImage.wait();

    const imageSet = await domainContract.getImage("good");
    console.log("Image set by good:", imageSet);

    // ##
    
    const settingMusic = await domainContract.setMusic("good", "https://open.spotify.com/track/13LrJDJhegSLCZzqd5InmU?si=bbf19260d9ec4481");
    await settingMusic.wait();

    const musicSet = await domainContract.getMusic("good");
    console.log("Music set by good", musicSet);

    // ##
    
    const settingName = await domainContract.setName("good", "Peter");
    await settingName.wait();

    const nameSet = await domainContract.getName("good");
    console.log("Name:", nameSet);

    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
    */}
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