import { ethers } from 'ethers';
import { openseaAbi } from './abi/openseaAbi.js';
import * as fs from 'fs';
import { erc20 } from './abi/erc20.js';
import { routerv2 } from './abi/routerv2.js';
import { pair } from './abi/pair.js';
import { BigNumber } from 'ethers';

export default class BSCData {
    url = 'https://bsc-dataseed1.defibit.io/';
    contractAddress = '0x9b8eecf97de95461082362e4afd3a0e27cfbc23e';
    pancakeAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
    pairAddress = '0x0450aC685B3a4c63C6CCF160D8289f97F6711F91';
    customHttpProvider = null;
    signer = null;
    presaleContract = null;
    pairContract = null;
    routerContract = null;
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

        this.pairContract = new ethers.Contract(
            this.pairAddress,
            pair,
            this.signer,
        );

        this.routerContract = new ethers.Contract(
            this.pancakeAddress,
            routerv2,
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

    async getRouter() {
        const header = 'from, in, out, dollar, type, txHash, block \r\n';
        try {
            fs.writeFileSync('tigger-swap.csv', header);
            //file written successfully
        } catch (err) {
            console.error(err);
        }

        let filter = {
            address: this.pancakeAddress,
            topics: [
                "0x7ff36ab5"

            ]
        };

        //let filterSwap = this.routerContract.filters.swapETHForExactTokens(null, null, null, null);

        let result = [];
        for (let index = 0; index < 1; index++) {
            const start = this.lastBlock - 1000 * (index + 1);
            const end = this.lastBlock - 1000 * index;
            console.log('from to', start, end);
            try {
                this.providers.ge
                let logsFrom = await this.routerContract.queryFilter(
                    filter,
                    start,
                    end,
                );
                console.log(logsFrom);
                result.push(logsFrom);
                await this.createFilePair(logsFrom);
                console.log('index file', this.indexFile);
            } catch (error) {
                console.log('error block', error);
            }
        }

        console.log('file created');
    }

    async getPair() {
        const header = 'caller, swap sender, swap to , in, out, dollar, type, txHash, block \r\n';
        try {
            fs.writeFileSync('tigger-swap.csv', header);
            //file written successfully
        } catch (err) {
            console.error(err);
        }

        let filterSwap = this.pairContract.filters.Swap();
        let filterTransfer = this.presaleContract.filters.Transfer();

        let result = [];
        for (let index = 0; index < 13; index++) {
            const start = this.lastBlock - 1000 * (index + 1);
            const end = this.lastBlock - 1000 * index;
            console.log('from to', start, end);
            try {
                let logsFrom = await this.pairContract.queryFilter(
                    filterSwap,
                    start,
                    end,
                );
                let txFrom = await this.presaleContract.queryFilter(
                    filterTransfer,
                    start,
                    end,
                );
                result.push(logsFrom);
                await this.createFilePair(logsFrom, txFrom);
                console.log('index file', this.indexFile);
            } catch (error) {
                console.log('error block', error);
            }
        }

        console.log('file created');
    }

    async createFilePair(logsFrom, txFrom) {
        let excludeAddress = [this.pairAddress, this.pancakeAddress, this.contractAddress];
        let dollarPrice = 372;
        let result = '';
        logsFrom = logsFrom.sort((a, b) => b.blockNumber - a.blockNumber);
        for (let index = 0; index < logsFrom.length; index++) {
            const element = logsFrom[index];
            //console.log(element);
            const args = element.args;
            let amountIn = args.amount0In.isZero() ? args.amount1In : args.amount0In;
            let amountOut = args.amount0Out.isZero() ? args.amount1Out : args.amount0Out;
            let typeSell = amountIn.gt(amountOut) ? "sell" : "buy";
            let caller = "";
            if (args.sender !== this.pancakeAddress) {
                caller = args.sender;
            } else if (args.to !== this.pancakeAddress) {
                caller = args.to;
            } else {
                let tx = txFrom?.filter(t => t.transactionHash === element.transactionHash);
                if (tx.length) {
                    for (let index = 0; index < tx.length; index++) {
                        const r = tx[index];
                        if (!excludeAddress.some(e => e === r.args.from)) {
                            caller = r.args.from;
                            break;
                        }
                        else if (!excludeAddress.some(e => e === r.args.to)) {
                            caller = r.args.to;
                            break;
                        }
                    }
                }
            }

            let dollar = typeSell === "sell" ? (this.transform(amountOut) * dollarPrice) : (this.transform(amountIn) * dollarPrice);
            result += `${caller},${args.sender},${args.to},${this.transform(amountIn)},${this.transform(amountOut)},${dollar},${typeSell},${element.transactionHash},${element.blockNumber}, \r\n`;

            this.indexFile++;
        }
        try {
            fs.appendFileSync('tigger-swap.csv', result);
            //file written successfully
        } catch (err) {
            console.error(err);
        }
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
