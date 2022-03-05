require('dotenv').config()

const axios = require('axios')
const _ = require('lodash')
const dayjs = require('dayjs')
const Big = require('big.js')
const cache = require('./cache')
const price = require('./price')

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

    console.log(
      `Last sale in Unix timestamp (seconds): ${cache.get(
        'lastSaleTime',
        null
      )}`
    )

    // get collection sales activites
    const response = await axios
      .get(
        `https://api-v2-mainnet.paras.id/collection-activities?collection_id=${process.env.COLLECTION_ID}&filter=sale`
      )
      .then((response) => response.data)
      .catch((error) => {
        console.log(error)
      })

    // check if status was success
    if (response.status === 1) {
      const currentNearPrice = await price.getNear()

      const saleData = response.data

      cache.set('lastSaleTime', saleData[0].issued_at)

      const recentSaleData = _.filter(
        saleData,
        (activity) => activity.issued_at > lastSaleTime
      )

      if (_.isArray(recentSaleData)) {
        console.log(`${recentSaleData.length} sales since the last one...`)

        const sortedSaleData = _.orderBy(recentSaleData, 'issued_at', 'asc')

        for (const sale of sortedSaleData) {
          const metadata = sale.data[0].metadata
          const msg = sale.msg

          const title = metadata.title
          const imageURL = metadata.media

          const datetime = msg.datetime
          const seller = truncate(msg.params.owner_id)
          const buyer = truncate(msg.params.buyer_id)
          const price = Big(msg.params.price)
            .div(10 ** 24)
            .toFixed()
          const priceUSD = price * currentNearPrice

          await postSaleToDiscord(
            title,
            seller,
            buyer,
            price,
            priceUSD.toFixed(2),
            imageURL,
            datetime
          )
        }
      }
    }
  }, 60000)
}

async function postSaleToDiscord(
  title,
  seller,
  buyer,
  price,
  priceUSD,
  imageURL,
  date
) {
  axios
    .post(process.env.WEBHOOK_URL, {
      embeds: [
        {
          title: `${title} → SOLD`,
          fields: [
            {
              name: 'Sale Price',
              value: `${price} NEAR \`($${priceUSD} USD)\``,
            },
            {
              name: 'Seller',
              value: `${seller}`,
              inline: true,
            },
            {
              name: 'Buyer',
              value: `${buyer}`,
              inline: true,
            },
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
    .then(await delay(1000))
}

// function truncate(
//   fullStr,
//   strLen = 12,
//   separator = '...',
//   frontChars = 5,
//   backChars = 6
// ) {
//   if (fullStr.length <= strLen) return fullStr

//   return (
//     fullStr.substr(0, frontChars) +
//     separator +
//     fullStr.substr(fullStr.length - backChars)
//   )
// }

runSalesBot()
