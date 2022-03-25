import { ethers } from 'ethers';
import { openseaAbi } from './abi/openseaAbi.js';
import * as fs from 'fs';
import { erc20 } from './abi/erc20.js';

export default class BSCData {
    url = 'https://bsc-dataseed1.defibit.io/';
    contractAddress = '0x9b8eecf97de95461082362e4afd3a0e27cfbc23e';
    customHttpProvider = null;
    signer = null;
    presaleContract = null;
    datas = [];
    lastBlock = 16068318;
    firstBlock = 16056898;
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
            erc20,
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
        const header = 'from, to, value, txHash, block \r\n';
        try {
            fs.writeFileSync('tigger.csv', header);
            //file written successfully
        } catch (err) {
            console.error(err);
        }

        let filterTransfer = this.presaleContract.filters.Transfer();

        let result = [];
        for (let index = 0; index < 13; index++) {
            const start = this.lastBlock - 1000 * (index + 1);
            const end = this.lastBlock - 1000 * index;
            console.log('from to', start, end);
            try {
                let logsFrom = await this.presaleContract.queryFilter(
                    filterTransfer,
                    start,
                    end,
                );
                result.push(logsFrom);
                await this.createFile(logsFrom);
                console.log('index file', this.indexFile);
            } catch (error) {
                console.log('error block', error);
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
            //console.log(element);
            const args = element.args;
            // let airDrop =
            //     logsFrom.filter(
            //         (r) => r.transactionHash == element.transactionHash,
            //     ).length > 1;
            // if (
            //     !airDrop &&
            //     args.value.toString() === '1' &&
            //     !this.uniqueAddress.some((uni) => uni === args.to)
            // ) {
            //     this.uniqueAddress.push(args.to);

            // }
            result += `${args.from},${args.to},${this.transform(args.value)},${element.transactionHash},${element.blockNumber} \r\n`;
            this.indexFile++;
        }
        try {
            fs.appendFileSync('tigger.csv', result);
            //file written successfully
        } catch (err) {
            console.error(err);
        }
    }


    transform(value) {
        return value / 10 ** 18;
        //return parseInt(value, 10) / 10 ** 8;
    }
}
