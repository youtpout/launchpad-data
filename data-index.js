import { ethers } from 'ethers'
import { launchpadAbi } from './abi/Launchpad.js'

export default class DataIndex {
    url = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    contractAddress = '0xFd553404A262FEb94c08FCe4b086A212BA5F4efF'
    customHttpProvider = null
    signer = null
    presaleContract = null
    datas = []

    constructor() {
        this.customHttpProvider = new ethers.providers.JsonRpcProvider(this.url)
        let privateKey =
            '0x0123456789012345678901234567890123456789012345678901234567890123'
        let wallet = new ethers.Wallet(privateKey)
        this.signer = wallet.connect(this.customHttpProvider)
        this.presaleContract = new ethers.Contract(
            this.contractAddress,
            launchpadAbi,
            this.signer,
        )
    }

    listen() {
        // filter on launchpad created
        let filterCreated = this.presaleContract.filters.PresaleCreated(
            null,
            null,
            null,
        )

        // filter on launchpad launched
        let filterLaunched = this.presaleContract.filters.PresaleLaunched(null)

        this.presaleContract.on(filterCreated, (owner, token, presaleId) => {
            // new launchpad created
            console.log('launchpad created', owner, token, presaleId)
        })

        this.presaleContract.on(filterLaunched, (presaleId) => {
            // launchpad launched
            console.log('launchpad launched ', presaleId)
        })
    }

    async getData() {
        const count = await this.presaleContract.presalesCount()
        console.log(count)
        for (let index = 0; index < count; index++) {
            console.log(index)
            this.presaleContract
                .presales(index)
                .then((element) => this.datas.push(element))
        }
    }
}
