var ethers = require('ethers');  
var launchpadAbi = require('./abi/Launchpad.json');  
var url = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
var contractAddress='0xFd553404A262FEb94c08FCe4b086A212BA5F4efF';
var customHttpProvider = new ethers.providers.JsonRpcProvider(url);

var signer = customHttpProvider.getSigner();
var presaleContract = new ethers.Contract(
    contractAddress,
    launchpadAbi,
    signer
  );

    // filter on launchpad created
    let filterCreated = {
        address: contractAddress,
        topics: [ethers.utils.id('PresaleCreated(address,address,uint256)')],
      };

 // filter on launchpad launched
      let filterLaunched = {
        address: contractAddress,
        topics: [ethers.utils.id('PresaleLaunched(uint256)')],
      };

      customHttpProvider.on(filterCreated, (log, event) => {
        // new launchpad created
        console.log("launchpad created", log, event);
      });

      customHttpProvider.on(filterLaunched, (log, event) => {
        // launchpad launched
        console.log("launchpad launched", log, event);
      });

customHttpProvider.getBlockNumber().then((result) => {
    console.log("Current block number: " + result);
});

