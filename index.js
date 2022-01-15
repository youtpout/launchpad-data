var ethers = require('ethers');  
var launchpadAbi = require('./abi/Launchpad.json');  
var url = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
var contractAddress='0xFd553404A262FEb94c08FCe4b086A212BA5F4efF';
var customHttpProvider = new ethers.providers.JsonRpcProvider(url);

var signer = customHttpProvider.getSigner();
var presaleContract = new ethers.Contract(contractAddress,launchpadAbi,signer);

    // filter on launchpad created
      let filterCreated =   presaleContract.filters.PresaleCreated(null,null,null);

      // filter on launchpad launched
      let filterLaunched =presaleContract.filters.PresaleLaunched(null);

      presaleContract.on(filterCreated, (owner, token, presaleId) => {
        // new launchpad created
        console.log("launchpad created", owner,token,presaleId);
      });

      presaleContract.on(filterLaunched, (presaleId) => {
        // launchpad launched
        console.log("launchpad launched ", presaleId);
      });

customHttpProvider.getBlockNumber().then((result) => {
    console.log("Current block number: " + result);
});

