import { ethers } from 'ethers';
import express from 'express';
import DataIndex from './opensea-data.js';

var app = express();
const port = 3000;

var data = new DataIndex();
await data.getData();
data.listen();
var url = 'https://polygon-rpc.com';
var contractAddress = '0x2953399124f0cbb46d2cbacd8a89cf0599974963';
var customHttpProvider = new ethers.providers.JsonRpcProvider(url);

app.get('/', async function (req, res) {
    const blockNumber = await customHttpProvider.getBlockNumber();
    const block = await customHttpProvider.getBlock(blockNumber);
    res.send(
        `Current block number ${blockNumber} & timestamp ${
            block.timestamp
        } & date ${new Date(block.timestamp * 1000)}`,
    );
});

app.get('/presales', async function (req, res) {
    res.send(data.datas);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
