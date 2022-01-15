import DataIndex from './data-index.js'
import { ethers } from 'ethers'
import express from 'express'

var app = express()
const port = 3000

var data = new DataIndex()
await data.getData()
data.listen()
var url = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
var contractAddress = '0xFd553404A262FEb94c08FCe4b086A212BA5F4efF'
var customHttpProvider = new ethers.providers.JsonRpcProvider(url)

app.get('/', async function (req, res) {
    const blockNumber = await customHttpProvider.getBlockNumber()
    const block = await customHttpProvider.getBlock(blockNumber)
    res.send(
        `Current block number ${blockNumber} & timestamp ${
            block.timestamp
        } & date ${new Date(block.timestamp * 1000)}`,
    )
})

app.get('/presales', async function (req, res) {
    res.send(data.datas)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
