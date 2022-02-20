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
    lastBlock = 24826600;
    indexFile = 0;
    uniqueAddress = [];

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
        this.filterCreated = this.presaleContract.filters.TransferSingle();

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
        const header = 'to, from, value, txHash, block \r\n';
        try {
            fs.writeFileSync('opensea.csv', header);
            //file written successfully
        } catch (err) {
            console.error(err);
        }

        this.lastBlock = await this.customHttpProvider.getBlockNumber();

        let filterCreated = this.presaleContract.filters.TransferSingle();
        let result = [];
        for (let index = 0; index < 1000; index++) {
            const start = this.lastBlock - 1000 * (index + 1);
            const end = this.lastBlock - 1000 * index;
            console.log('from to', start, end);
            try {
                let logsFrom = await this.presaleContract.queryFilter(
                    filterCreated,
                    start,
                    end,
                );
                //result.push(logsFrom);
                await this.createFile(logsFrom);
                console.log('index file', this.indexFile);
            } catch (error) {
                console.log('error block');
            }
        }

        console.log('file created');
    }

    async tryFilter(filterCreated, start, end) {
        return await this.presaleContract.queryFilter(
            filterCreated,
            start,
            end,
        );
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
            if (
                !airDrop &&
                args.value.toString() === '1' &&
                !this.uniqueAddress.some((uni) => uni === args.to)
            ) {
                this.uniqueAddress.push(args.to);
                result += `${args.to},${args.from},${args.value},${element.transactionHash},${element.blockNumber} \r\n`;
                this.indexFile++;
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
