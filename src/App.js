import React, { useEffect, useState } from "react";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";

import contractABI from './utils/contractABI.json';

import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';

// Constants
const TWITTER_HANDLE = 'awoldavi';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// Add the domain you will be minting
const tld = '.vibes';

// hard-code the smart contract address
const CONTRACT_ADDRESS = '0x9B5EfF07987766c11F6CC0C57934744E41155543';

const App = () => {
	// Add a new stateful variable at the start of the 'const App = () =>' component
	const [editing, setEditing] = useState(false);

	// Create a stateful variable to store the network next to all the others
	const [network, setNetwork] = useState('');

	// Just a state variable we use to store our user's public wallet
	const [currentAccount, setCurrentAccount] = useState('');

	// Add some state data properties
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');
	// const [imageLinks, setImage] = useState('');
	// const [spotifyUrl, setMusic] = useState('');
	// const [userName, setName] = useState('');

	// Add a stateful array just beneath the other useState calls
	const [mints, setMints] = useState([]);

	const [loading, setLoading] = useState(false)


	// Implement your connectWallet method/function here
	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// Fancy method to request access to account
			const accounts = await ethereum.request({ method: "eth_requestAccounts"});

			// Great! This should print our public address once we authorize MetaMask
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}

	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// Try to switch to the Mumbai testnet
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					// The 'chainId' parameter is a hexadecimal value that identifies different networks
					// The most common ones will be listed in the 'network.js' file
					params: [{ chainId: '0x13881' }], // Ref. the 'network.js' file for hexadecimal network ids
				});
			} catch (error) {
				// This error code means that the chain we want, has not been added to MetaMask yet
				// In this case, we want to ask the user to add it to their MetaMask wallet
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
										name: "Mumbai Matic",
										symbol: "MATIC",
										decimals: 18
									},
									blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
								},
							],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// If 'window.ethereum' is NOT found, then MetaMask is not installed
			alert('MetaMask is not installed. Please install it to use this dApp: https://metamask.io/download.html');
		}
	}

	// Gotta make sure that this is async
	// And update the 'checkIfWalletIsConnected' function to handle the inclusion of the network
	const checkIfWalletIsConnected = async () => {
		// First make sure we have access to window.ethereum
		const { ethereum } = window;

		if (!ethereum) {
			console.log("Make sure you have MetaMask!");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		// Check if we're authorized to access the user's wallet
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		// Users can have multiple authorized accounts, we grab the first one if it's there
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

		// We now check the user's network 'chain ID'
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);

		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

	// We will now need to call the 'register' function we wrote into our smart contract
	// Ref. (Line: 146) in 'Domains.sol'

	const mintDomain = async () => {
		// Dont run if the domain is empty
		if (!domain) {return }
		// Alert the user if the domain is too short
		if (domain.length < 2) {
			alert('Domain must be at least 2 characters long');
			return;
		}
		// Alert the user if the domain is too long
		if (domain.length > 8) {
			alert('Domain must be a maximum of 8 characters long');
			return;
		}

			// Calculate price based on length of domain (change this to match your contract)
			// 2 chars = 0.5 $MATIC, 4 chars = 0.3 $MATIC, 5 or more chars = 0.1 $MATIC
			const price = domain.length === 2 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
			console.log("Minting domain", domain, "with price", price);
		try {
			const { ethereum } = window;
			if (ethereum) {
				// 'ethers' is a library that helps our frontend talk to our smart contract
				// A 'provider' is what we use to actually talk to Polygon nodes (contd. below)
				// We use Alchemy (https://www.alchemy.com/) to deploy our smart contract
				// And in this case, we use nodes that MetaMask provides in the background to send/receive data from our deployed contract
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();

				// The following line actually creates the connection to your smart contract
				// It needs: 1) the contract's address 2) something called an .abi 3) and a signer
				// These are the 3 things we always need to communicate with smart contracts on the blockchain
				// The .abi file in particular, is something our dApp needs in order to know how to communicate with our contract
				// The contents of the .abi file can be found in a json file in your hardhat project (../artifacts/contracts)
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
				console.log("Going to pop open wallet to pay ⛽️ gas...")
					
				// Call our smart contract using 'register'
				let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
					
				// Wait for the transaction to be mined
				const receipt = await tx.wait();

					// Check if the transaction was successfully completed
					if (receipt.status === 1) {
						console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);

						// Set the RECORD for the domain
						tx = await contract.setRecord(domain, record);
						await tx.wait();
						console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);

						// Set the IMAGE for the domain {{ DEFUNCT }}
						// tx = await contract.setImage(domain, imageLinks);
						// tx.wait();
						// console.log("Image set! https://mumbai.polygonscan.com/tx/"+tx.hash);

						// Set the MUSIC for the domain {{ DEFUNCT }}
						// tx = await contract.setMusic(domain, spotifyUrl);
						// tx.wait();
						// console.log("Music set! https://mumbai.polygonscan.com/tx/"+tx.hash);

						// Set the NAME for the domain {{ DEFUNCT }}
						// tx = await contract.setName(domain, userName);
						// tx.wait();
						// console.log("Name set! https://mumbai.polygonscan.com/tx/"+tx.hash);

						// ##

						// Call 'fetchMints' (see Line: 269) after 2 seconds
						setTimeout(() => {
							fetchMints();
						}, 2000);


						setRecord('');
						setDomain('');
						// setImage('');
						// setMusic('');
						// setName('');
					}
					else {
						alert("Transaction failed! Please try again");
					}
			}
		}
		catch (error) {
			console.log(error);
		}
	};

	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

				let tx = await contract.setRecord(domain, record);
				await tx.wait();
				console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

				fetchMints();
				setRecord('');
				setDomain('');
			}
		} catch(error) {
			console.log(error);
		}
		setLoading(false);
	}

	// The 'fetchMints' function fetches 3 things (contd. below):
	// 1) All the existing domain names from the smart contract
	// 2) The records listed under each domain
	// 3) The owner's wallet address for reach domain
	// It puts these in an array, and then sets the array as our mints
	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				// You know all this
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

				// Get all the domain names from our smart contract
				const names = await contract.getAllNames();

				// For each name, get the record and the wallet address of the domain owner
				const mintRecords = await Promise.all(names.map(async (name) => {
					const mintRecord = await contract.records(name);
					const owner = await contract.domains(name);
					return {
						id: names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner,
					};
				}));

				console.log("MINTS FETCHED ", mintRecords);
				setMints(mintRecords);
			}
		} catch(error) {
			console.log(error);
		}
	}

	// This will run any time 'currentAccount' or network are changed
	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		}
	}, [currentAccount, network]);

	// Render Methods
	// Create a function to render if wallet is NOT connected yet
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://i.imgur.com/h2ltXA9.gif" alt="plant gif" />
			{/* Call the connectWallet method/function we wrote (Line: 46), when the button is clicked */}
			<button onClick={connectWallet} className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
	);

	// Form to enter domain name and data
	// The 'renderInputForm' is a pretty standard React block
	// It uses input fields tied to stateful variables
	const renderInputForm = () => {
		// If user is not on Polygon's Mumbai Testnet network (contd. below)
		// Render "Please connect to Polygon Mumbai Testnet"
		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<p>Please connect to the Polygon Mumbai Testnet</p>
					{/* This button will call our 'switchNetwork' function (See Line: 66) */}
					<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			);
		}
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder="what's your vibe?"
					onChange={e => setRecord(e.target.value)}
				/>

					{/*

					// If the editing variable is TRUE, then return 'Set record' and 'Cancel' buttons
					// All that is occurring here, is we are rendering 2 different buttons if the dApp is in 'edit' mode

					// 1) The 'Set record' button will call the 'updateDomain' function (see Line: 239)
					// 2) And the 'Cancel' button will take us out of editing mode

					*/}
					{editing ? (
						<div className="button-container">
							{/* This will call the updateDomain function we made (see Line: 239) */}
							<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
								Set record
							</button>
							 {/* This will let us get out of editing mode, by setting editing to 'false' */}
							<button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
								Cancel
							</button>
						</div>
					) : (
						// If editing is NOT true, the mint button will be returned instead
						<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
							Mint
						</button>
					)}
			</div>
		
		);
	}


	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className="mint-container">
					<p className="subtitle"> Recently minted domains</p>
					<div className="mint-list">
						{/*
						
						// 'mints.map' takes each item in the mints array, and renders some HTML for it
						// It uses the values of the items in the actual HTML with 'mint.name' and 'mint.id'

						*/}
						{ mints.map((mint, index) => {
							return (
								<div className="mint-item" key={index}>
									<div className='mint-row'>
										<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
											<p className="underlined">{' '}{mint.name}{tld}{' '}</p>
										</a>
										{/* If mint.owner is currentAccount, add an "edit" button*/}
										{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
											<button className="edit-button" onClick={() => editRecord(mint.name)}>
												<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
											</button>
											:
											null
										}
									</div>
						<p> {mint.record} </p>
					</div>)
					})}
				</div>
			</div>);
		}
	};

	// This will take the user into edit mode, and show them the edit buttons
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}


				/* {{ DEFUNCT }}
				<input
					type="url"
					value={imageLinks}
					placeholder="visual vibe"
					onChange={e => setImage(e.target.value)}
				/>
				*/

				/* {{ DEFUNCT }}
				<input
					type="url"
					value={spotifyUrl}
					placeholder="song vibe"
					onChange={e => setMusic(e.target.value)}
				/>
				*/

				/* {{ DEFUNCT }}
				<input
					type="text"
					value={userName}
					placeholder="name"
					onChange={e => setName(e.target.value)}
				/>
				*/

				
				/* {{ DEFUNCT }}
				<div className="button-container">
					{/* Call the mintDomain function when the button is clicked
					<button className='cta-button mint-button' onClick={mintDomain}>
						Mint
					</button>
					
					<button className='cta-button mint-button' disabled={null} onClick={null}>
						Set data
					</button>
					*/

	// This runs our function when the page loads
	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
						<div className="left">
						<p className="title">🍃 Vibes Domain Service</p>
						<p className="subtitle">an on-chain API</p>
						</div>
						{/* Display a logo and wallet connection status */}
						<div className="right">
							<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
							{/* ##
								// The question mark operator ? takes three operands (contd. below):
								// 1) some condition 2) a value if that condition is TRUE 3) and a value if that condition is TRUE
								// It is used in JavaScript to shorten an if else statement to one line of code. */}
							{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
						</div>
					</header>
				</div>

				{/* Add your render method here
				// But hide the connect button if currentAccount is not empty
				// The '&&' syntax might look a bit weird - but all it does is (contd. below):
				// It returns the render function, IF the condition before the '&&' is true */}
				{!currentAccount && renderNotConnectedContainer()}

				{/* Render the input form if an account is connected */}
				{currentAccount && renderInputForm()}

				{mints && renderMints()}

        		<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer">
						{`made by @${TWITTER_HANDLE}`}
					</a>
				</div>
			</div>
		</div>
	);
}

export default App;
