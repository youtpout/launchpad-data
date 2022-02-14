import { ethers } from 'ethers';
import { openseaAbi } from './abi/openseaAbi.js';

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
        // filter on launchpad created
        let filterCreated = this.presaleContract.filters.TransferSingle(
            null,
            null,
            null,
            null,
            null,
        );

        // filter on launchpad launched

        // this.presaleContract.on(
        //     filterCreated,
        //     (operator, from, to, id, value) => {
        //         // new launchpad created
        //         console.log('transfer single', operator, from, to, id, value);
        //     },
        // );

        // let filter = {
        //     address: this.contractAddress,
        //     topics: [
        //         ethers.utils.id(
        //             'TransferSingle(address,address,address,uint256,uint256)',
        //         ),
        //     ],
        // };

        // this.customHttpProvider.on(filter, (log, event) => {
        //     // Emitted whenever a DAI token transfer occurs
        //     console.log('transfer single', log, event);
        // });

        this.presaleContract.on(
            'TransferSingle',
            (operator, from, to, id, value, event) => {
                // new launchpad created
                //console.log('transfer single', operator, from, to, id, value);
                console.log('event', JSON.stringify(event.transactionHash));
            },
        );
    }

    async getData() {
        // const count = await this.presaleContract.presalesCount()
        // console.log(count)
        // for (let index = 0; index < count; index++) {
        //     console.log(index)
        //     this.presaleContract
        //         .presales(index)
        //         .then((element) => this.datas.push(element))
        // }
    }
}
