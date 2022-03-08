import { ethers } from 'ethers';
import * as fs from 'fs';
import { contractAbi } from './abi/contractAbi.js';

export default class DataIndex {
    url = 'https://polygon-rpc.com';
    contractAddress = '0xDEDeE6BDCEDbBFD0177973b3EFf3d119cA7e6E60';
    customHttpProvider = null;
    signer = null;
    presaleContract = null;
    datas = [];
    lastBlock = 24926600;

    constructor() {
        this.customHttpProvider = new ethers.providers.JsonRpcProvider(
            this.url,
        );
        let privateKey =
            '0x0123456789012345678901234567890123456789012345678901234567890123';
        let wallet = new ethers.Wallet(privateKey);
        this.signer = wallet.connect(this.customHttpProvider);
        this.presaleContract = new ethers.Contract(
            this.contractAddress,
            contractAbi,
            this.signer,
        );
    }

    async getData() {

        const listContracts=[];
        const listWallets=[];
        const listInvalids=[];
        try {

          const allFileContents = fs.readFileSync('addressesleft.csv', 'utf-8');

          var lines= allFileContents.split(/\r?\n/);
          console.log("lines",lines.length);

          for (let index = 0; index < lines.length; index++) {
              const line = lines[index];
              try {
                const address=ethers.utils.getAddress(line.toLowerCase());
                const isContract=await this.presaleContract.isContract(address);
                console.log(address,isContract);
                if(isContract){
                    listContracts.push(address);
                }else{
                    listWallets.push(address);
                }
              } catch (err) {
                console.error(err);
                listInvalids.push(line);
              }
          }

        } catch (err) {
            console.error(err);
        }

        console.log("read end");

        let contractFile='';
        let walletFile='';
        let invalidFile='';
         listContracts.forEach(r=>{
             contractFile+=r+" \r\n";
         })
         listWallets.forEach(r=>{
            walletFile+=r+" \r\n";
        })
        listInvalids.forEach(r=>{
            invalidFile+=r+" \r\n";
        })
        try {
            fs.appendFileSync('contracts.csv', contractFile);
            fs.appendFileSync('wallets.csv', walletFile);
            fs.appendFileSync('invalids.csv', invalidFile);
            //file written successfully
        } catch (err) {
            console.error(err);
        }
    }

    async createFile(logsFrom) {
        let result = '';
        logsFrom = logsFrom.sort((a, b) => b.blockNumber - a.blockNumber);
        for (let index = 0; index < logsFrom.length; index++) {
            const element = logsFrom[index];
            const args = element.args;
            let airDrop =
                logsFrom.filter(
                    (r) => r.transactionHash == element.transactionHash,
                ).length > 1;
            if (!airDrop && args.value.toString() === '1') {
                result += `${args.to},${args.from},${args.value},${element.transactionHash},${element.blockNumber} \r\n`;
            }
        }
        try {
            fs.appendFileSync('opensea.csv', result);
            //file written successfully
        } catch (err) {
            console.error(err);
        }
    }
}
