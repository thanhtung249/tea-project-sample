//load balance when choose the token
//change ui
const BigNumber = require('bignumber.js');
const qs = require('qs');
const web3 = require('web3');

let currentTrade = {};
let currentSelectSide;
let tokens;
let isConnect = false;
let balanceMiniNumber = 0;

async function init() {
    await listAvailableTokens();
}

async function listAvailableTokens() {
    console.log("initializing");
    // let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
    let tokenListJSON = {
        "tokens": [
            {
                "chainId":1,
                "address":"BNB",
                "name":"Binance Coin",
                "symbol":"BNB",
                "decimals":18,
                "logoURI":"https://assets.coingecko.com/coins/images/22884/thumb/BNB_wh_small.png?1644224553"
            },
            // {
            //     "chainId":1,
            //     "address":"0xeEeEEb57642040bE42185f49C52F7E9B38f8eeeE",
            //     "name":"ELK Finance",
            //     "symbol":"ELK",
            //     "decimals":18,
            //     "logoURI":"https://assets.coingecko.com/coins/images/9576/thumb/BUSD.png?1568947766"
            // },
            {
                "chainId":1,
                "address":"0x55d398326f99059ff775485246999027b3197955",
                "name":"Tether",
                "symbol":"USDT",
                "decimals":18,
                "logoURI":"https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png?1598003707"
            },
            {
                "chainId":1,
                "address":"0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                "name":"USD Coin",
                "symbol":"USDC",
                "decimals":18,
                "logoURI":"https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389"
            },
            {
                "chainId":1,
                "address":"0xe9e7cea3dedca5984780bafc599bd69add087d56",
                "name":"Binance USD",
                "symbol":"BUSD",
                "decimals":18,
                "logoURI":"https://assets.coingecko.com/coins/images/9576/thumb/BUSD.png?1568947766"
            }
        ]
    };
    tokens = tokenListJSON.tokens;
    console.log("tokens: ", tokens);
    createTokenList(tokens);
}

function createTokenList(tokens) {
    // Create token list for modal
    let parent = document.getElementById("token_list");
    for (const i in tokens) {
        //set default token
        if(i==0) {
            currentTrade["from"] = tokens[i]; 
        }
        // Token row in the modal token list
        let div = document.createElement("div");
        div.className = "item -h68";

        let html = `
        <div class="icon x32">
            <img src="${tokens[i].logoURI}" alt="">
        </div>
        <div class="text-content">
            <div class="title">${tokens[i].symbol}</div>
            <div class="desc">${tokens[i].symbol}</div>
        </div>
        <div id="balance_token_${tokens[i].symbol.toLowerCase()}" class="number">0</div>
          `;
        div.innerHTML = html;
        div.onclick = () => {
            selectToken(tokens[i]);
        };
        parent.appendChild(div);
    };
}

async function selectToken(token){
    closeModal();
    currentTrade[currentSelectSide] = token;
    console.log("currentTrade: ", currentTrade);
    let balance = 0;
    if (typeof window.ethereum !== "undefined") {
        balance = await getERC20Balance(token);
    }
    await renderInterface(balance, currentSelectSide);
}

async function renderInterface(balance, currentSelectSide){
    if (currentSelectSide == "from"){
        console.log(currentTrade.from);
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
        document.getElementById("balance_mini").innerHTML = "Balance: " + parseBalanceFloor(balance);
        balanceMiniNumber = parseBalanceFloor(balance);
    }
    if (currentSelectSide == "to"){
        console.log(currentTrade.to);
        document.getElementById("to_token_img").style.display = "inline";
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
        document.getElementById("to_select_token").style.display = "none";
    }

    if(currentTrade.from && currentTrade.to) {
        // document.getElementById("swap_button").value = "Swap";
        // document.getElementById("swap_button").disabled = false;
        document.getElementById("transform_button").disabled = false;
        await getPrice();
    }
}

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            console.log("connecting");
            let accounts = await ethereum.request({ method: "eth_requestAccounts" });
            let shortcutAddressWallet = accounts[0].replace(accounts[0].substring(6,38), "...");
            document.getElementById("login_button").innerHTML = "";
            let balance = await getBalance();
            let parent = document.getElementById("connected_wallet");
            let html = `
            <div class="account-balance">${parseBalanceFloor(balance)}</div>
            <div class="option-account-address">
                <span class="icon">
                    <img src="https://assets.coingecko.com/coins/images/22884/thumb/BNB_wh_small.png?1644224553"" alt="">
                </span>
                <span class="text-m">${shortcutAddressWallet}</span>             
            </div>
            `
            parent.innerHTML = html;

            document.getElementById("swap_connect").style.display = "none";

            document.getElementById("swap_module").style.display = "block";

            document.getElementById("balance_mini").innerHTML = "Balance: " + parseBalanceFloor(balance);
            balanceMiniNumber = parseBalanceFloor(balance);
            isConnect = true;
            loadBalanceToken();
        } catch (error) {
            console.log(error);
        }
        // const accounts = await ethereum.request({ method: "eth_accounts" });
        // document.getElementById("swap_button").disabled = false;
    } else {
        document.getElementById("login_button").innerHTML = "Please install MetaMask";
    }
}

function parseBalanceFloor(balance) {
    return parseFloat(balance-0.00001).toFixed(5);
}

async function loadBalanceToken() {
    if (typeof window.ethereum !== "undefined") {
        for (const i in tokens) {
            if(tokens[i].symbol !== "BNB") {
                let balance = await getERC20Balance(tokens[i]);
                balance = parseBalanceFloor(balance);
                if(typeof balance !== "undefined") {
                    let id_token = "balance_token_" + tokens[i].symbol.toLowerCase();
                    document.getElementById(id_token).innerHTML=balance;  
                }             
            }else {
                let balance = await getBalance();
                balance = parseBalanceFloor(balance);
                if(typeof balance !== "undefined") {
                    let id_token = "balance_token_" + tokens[i].symbol.toLowerCase();
                    document.getElementById(id_token).innerHTML=balance;
                }   
            }  
        }
    }
}

function openModal(side){
    if (isConnect) {
        loadBalanceToken();
    }
    currentSelectSide = side;
    // document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    const el = document.querySelector('#selectToken');
    el.classList.remove("show");
}

async function getPrice(){
    console.log("Getting Price");
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
    let slippage = document.getElementById("slippage_config").value/100;
    const params = {
        // sellToken: 'BNB',
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
        slippagePercentage : slippage,
    }
  
    // Fetch the swap price.
    const response = await fetch(`https://bsc.api.0x.org/swap/v1/price?${qs.stringify(params)}`);
    
    swapPriceJSON = await response.json();
    console.log("Price: ", swapPriceJSON);
    
    let buyAmount = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("to_amount").value = buyAmount;
    let slippageAmount = buyAmount*(100-slippage);
    //estimatedPriceImpact
    //expectedSlippage
    //estimatedGas
    let price = swapPriceJSON.price;
    document.getElementById("to_amount").innerHTML="1 " + currentTrade.from.symbol + " = " + price + " " + currentTrade.to.symbol;
    document.getElementById("expected_output").innerHTML=parseBalanceFloor(buyAmount) + " " + currentTrade.to.symbol;
    document.getElementById("price_impact").innerHTML= swapPriceJSON.estimatedPriceImpact + " %";
    document.getElementById("estimated_gas").innerHTML= swapPriceJSON.estimatedGas;

    let parent = document.getElementById("slippage_token");
    let html = `
        <span>Minimum received after slippage (${slippage*100}%)</span><span>${slippageAmount/100} ${currentTrade.to.symbol}</span>
    `
    parent.innerHTML = html;
    
}

async function getQuote(account){
    console.log("Getting Quote");
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
    let slippage = document.getElementById("slippage_config").value/100;
    const params = {
        // sellToken: 'BNB',
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
        takerAddress: account,
        slippagePercentage : slippage,
        // skipValidation : true
    }
  
    // Fetch the swap quote.
    // const response = await fetch('https://api.0x.org/swap/v1/quote?sellToken=ETH&buyToken=DAI&sellAmount=1000000000000000&takerAddress=0xa57aebb29f5b099b395dda7d4add329bfc6bece0');
    const response = await fetch(`https://bsc.api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
    
    swapQuoteJSON = await response.json();
    // swapQuoteJSON.from=account;
    console.log("Quote: ", swapQuoteJSON);
    
    document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
    // document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;
  
    return swapQuoteJSON;
}

async function tryTransform(){
    console.log("Getting transform");

    if (!currentTrade.from || !currentTrade.to) return;
    let tempCurrentTrade;
    console.log(currentTrade.from)
    document.getElementById("from_token_img").src = currentTrade.to.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.to.symbol;
    document.getElementById("from_amount").value = 0;

   
    console.log(currentTrade.to)
    document.getElementById("to_token_img").src = currentTrade.from.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.from.symbol;
    document.getElementById("to_amount").value = 0;

    tempCurrentTrade = currentTrade.from;
    currentTrade.from = currentTrade.to;
    currentTrade.to = tempCurrentTrade;
}

async function getToken() {
    let tokenAddress = document.getElementById("find_token").value;
    console.log("Getting Token");
    if(!tokenAddress) return;
    const response = await fetch('https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/' + tokenAddress);
    responseJSON = await response.json();

    let address = tokenAddress;
    let name = responseJSON.name;
    let symbol = responseJSON.symbol;
    let decimals = responseJSON.detail_platforms['binance-smart-chain'].decimal_place;
    let logoURI = responseJSON.image.small;

    let token = [{
        "address":address,
        "name":name,
        "symbol":symbol.toUpperCase(),
        "decimals":decimals,
        "logoURI":logoURI
    }];
    tokens.push(token);
    createTokenList(token);

    // if(responseJSON) {
    //     debugger;
    //     createTokenList(responseJSON);
    // }
        
    console.log(responseJSON);
}

function setBalanceMini() {
    document.getElementById("from_amount").value = balanceMiniNumber;
    getPrice();
}

async function getERC20Balance(token){
    let accounts = await ethereum.request({ method: "eth_accounts" });
    let takerAddress = accounts[0];
    // Fetch the balances
    let tokenBalance = await fetch(`https://deep-index.moralis.io/api/v2/${takerAddress}/erc20?chain=bsc&token_addresses=${token.address}`, {
    method: 'GET', // or 'PUT'
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'QMqDVX358WULG4iAKsykoQUJrVfEpzy1nacsVFig0E2jQqx7Du5tefG5F8qzpCEx'
    },
    })
    .then((response) => response.json())
    .then((data) => {
        if (typeof data !== 'undefined' && data.length > 0) {
            return data[0].balance / (10 ** token.decimals);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    return tokenBalance;
}

async function getBalance(){
    let accounts = await ethereum.request({ method: "eth_accounts" });
    let takerAddress = accounts[0];
    // Fetch the balances
    let nativeBalance = await fetch(`https://deep-index.moralis.io/api/v2/${takerAddress}/balance?chain=bsc`, {
    method: 'GET', // or 'PUT'
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'QMqDVX358WULG4iAKsykoQUJrVfEpzy1nacsVFig0E2jQqx7Du5tefG5F8qzpCEx'
    },
    })
    .then((response) => response.json())
    .then((data) => {
        return data.balance / (10 ** 18);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    return nativeBalance;
}

async function trySwap(){
    const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }]
    console.log("trying swap");

    document.getElementById("swap_button").disabled = true;
    document.getElementById("swap_button").style.background = "gray";
    // Only work if MetaMask is connect
    // Connecting to Ethereum: Metamask
    const web3 = new Web3(Web3.givenProvider);
  
    // The address, if any, of the most recently used account that the caller is permitted to access
    let accounts = await ethereum.request({ method: "eth_accounts" });
    let takerAddress = accounts[0];
    console.log("takerAddress: ", takerAddress);
  
    const swapQuoteJSON = await getQuote(takerAddress);
  
    // Set Token Allowance
    // Set up approval amount
    let fromTokenAddress = "";
    if (currentTrade.from.address == "BNB") {
        fromTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    } else {
        fromTokenAddress = currentTrade.from.address;
    }
    const maxApproval = new BigNumber(2).pow(256).minus(1);
    console.log("approval amount: ", maxApproval);
    const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
    console.log("setup ERC20TokenContract: ", ERC20TokenContract);
  
    // Grant the allowance target an allowance to spend our tokens.
    let gotError=false;
    const tx = await ERC20TokenContract.methods.approve(
        swapQuoteJSON.allowanceTarget,
        maxApproval,
    )
    .send({ from: takerAddress })
    .then(tx => {
        console.log("tx: ", tx)
    }).catch((error) => {
        console.error('Error:', error);
        gotError=true;
        document.getElementById("swap_button").disabled = false;
        // getElementById('sample_id').removeAttribute("style");
        document.getElementById("swap_button").style.background = "";
    });

    if(gotError)
        return;
    
    // Perform the swap
    const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
    console.log("receipt: ", receipt);
    //Show popup
    let sellNumberToken = parseBalanceFloor(swapQuoteJSON.sellAmount/(10 ** currentTrade.from.decimals));
    let sellTokenSymbol = document.getElementById("from_token_text").textContent;
    let buyNumberToken = parseBalanceFloor(swapQuoteJSON.buyAmount/(10 ** currentTrade.to.decimals));
    let buyTokenSymbol = document.getElementById("to_token_text").textContent;
    
    let explorerUrl = "https://bscscan.com/tx/"+receipt.transactionHash;
    document.getElementById("view_explorer").href=explorerUrl;
    document.getElementById("popup_swap_from").innerHTML="Swap Exactly " + sellNumberToken + " " + sellTokenSymbol + " for";
    document.getElementById("popup_swap_to").innerHTML=buyNumberToken + " " + buyTokenSymbol;
    document.getElementById("popup_swap_sucessfully").style.display = "flex";
    setTimeout(function(){
        document.getElementById("popup_swap_sucessfully").style.display = "none";
    },5000);
    
}

init();

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
    openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
// document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;
if(typeof document.getElementById("swap_button") !== "undefined" && document.getElementById("swap_button") != null) {
    document.getElementById("swap_button").onclick = trySwap;
}

document.getElementById("transform_button").onclick = tryTransform;
document.getElementById("set_balance_mini").onclick = setBalanceMini; 
// document.getElementById("find_token").onblur = getToken;