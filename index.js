require('dotenv').config()

const axios = require('axios')
const _ = require('lodash')
const dayjs = require('dayjs')
const Big = require('big.js')
const cache = require('./cache')
const price = require('./price')
const rankList = require('./data/rank.json')

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function truncate(string, limit = 14) {
  return string.length > limit ? `${string.substr(0, limit)}...` : string
}

async function runSalesBot() {
  console.log(`starting ${process.env.COLLECTION_ID} sales bot...`)

  setInterval(async () => {
    const lastSaleTime =
      cache.get('lastSaleTime', null) ||
      dayjs().startOf('minute').subtract(59, 'seconds').valueOf()

    let activities

    console.log(
      `Last sale in Unix timestamp (seconds): ${cache.get(
        'lastSaleTime',
        null
      )}`
    )

    // get collection sales activites
    try {
      activities = await axios
        .get(
          `https://api-v2-mainnet.paras.id/collection-activities?collection_id=${process.env.COLLECTION_ID}&filter=sale`
        )
        .then((response) => response.data)
    } catch (err) {
      console.log('error fetching activities: ', err)
    }

    // check if status was success
    if (activities && activities.status === 1) {
      let currentNearPrice = 0
      try {
        currentNearPrice = await price.getNear()
      } catch (err) {
        console.log('error fetching NEAR price: ', err)
      }

      const allSaleData = activities.data

      cache.set('lastSaleTime', allSaleData[0].issued_at)

      const recentSaleData = _.filter(
        allSaleData,
        (activity) => activity.issued_at > lastSaleTime
      )

      if (_.isArray(recentSaleData)) {
        console.log(`${recentSaleData.length} sales since the last one...`)

        const sortedSaleData = _.orderBy(recentSaleData, 'issued_at', 'asc')

        for (const sale of sortedSaleData) {
          try {
            const metadata = sale.data[0].metadata
            const msg = sale.msg
            // const transactionHash = sale.transaction_hash

            const title = metadata.title
            const imageURL = metadata.media

            const datetime = msg.datetime
            const seller = truncate(msg.params.owner_id)
            const buyer = truncate(msg.params.buyer_id)
            const price = Big(msg.params.price)
              .div(10 ** 24)
              .toFixed()
            const priceUSD = price * currentNearPrice

            const tokenId = parseInt(msg.params.token_id)
            const rank = rankList[tokenId].rank

            await postSaleToDiscord(
              title,
              seller,
              buyer,
              price,
              priceUSD.toFixed(2),
              rank,
              // transactionHash,
              imageURL,
              datetime
            )
          } catch (err) {
            console.log('error while going through sales data: ', err)
          }
        }
      }
    }
  }, 300000)
}

async function postSaleToDiscord(
  title,
  seller,
  buyer,
  price,
  priceUSD,
  rank,
  // transactionHash,
  imageURL,
  date
) {
  axios
    .post(process.env.WEBHOOK_URL, {
      embeds: [
        {
          color: 16568858,
          title: `${title} → SOLD`,
          fields: [
            {
              name: 'Sale Price',
              value: `${price} NEAR \`($${priceUSD} USD)\``,
            },
            // {
            //   name: 'Seller',
            //   value: `||${seller}||`,
            //   inline: true,
            // },
            {
              name: 'Rank',
              value: `${rank}`,
              inline: true,
            },
            {
              name: 'Buyer',
              value: `${buyer}`,
              inline: true,
            },
            // {
            //   name: 'Transaction',
            //   value: `[${transactionHash}](https://nearblocks.io/txns/${transactionHash})`,
            // },
          ],
          image: {
            url: `${imageURL}`,
          },
          footer: {
            text: 'Sold on Paras',
          },
          timestamp: `${date}`,
        },
      ],
    })
    .then(await delay(1500))
}

runSalesBot()
