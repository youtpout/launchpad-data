import { ethers } from 'ethers';
import { openseaAbi } from './abi/openseaAbi.js';
import * as fs from 'fs';

export default class DataIndex {
    url = 'https://polygon-rpc.com';
    contractAddress = '0x2953399124f0cbb46d2cbacd8a89cf0599974963';
    customHttpProvider = null;
    signer = null;
    presaleContract = null;
    datas = [];

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
            openseaAbi,
            this.signer,
        );
    }

    listen() {
        return;
        // filter on launchpad created
        let filterCreated = this.presaleContract.filters.TransferSingle();

        // filter on launchpad launched

        this.presaleContract.on(
            filterCreated,
            (operator, from, to, id, value, event) => {
                // new launchpad created
                console.log('transfer single', operator, from, to, id, value);
                console.log('event', event.transactionHash);
            },
        );
    }

    async getData() {
        const header =
            'to, operator, from, id, value, type, txHash, block \r\n';
        try {
            fs.writeFileSync('opensea.csv', header);
            //file written successfully
        } catch (err) {
            console.error(err);
        }

        let filterCreated = this.presaleContract.filters.TransferSingle();
        let logsFrom = await this.presaleContract.queryFilter(
            filterCreated,
            -100,
            'latest',
        );
        await this.createFile(logsFrom);
        console.log('file created');
    }

    async createFile(logsFrom) {
        let result = '';
        for (let index = 0; index < logsFrom.length; index++) {
            const element = logsFrom[index];
            const args = element.args;
            let airType =
                logsFrom.filter(
                    (r) => r.transactionHash == element.transactionHash,
                ).length > 1
                    ? 'airdrop'
                    : 'single';
            result += `${args.to},${args.operator},${args.from},${args.id},${args.value},${airType},${element.transactionHash},${element.blockNumber} \r\n`;
        }
        try {
            fs.appendFileSync('opensea.csv', result);
            //file written successfully
        } catch (err) {
            console.error(err);
        }
    }
}
