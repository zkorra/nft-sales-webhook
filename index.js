import dotenv from "dotenv"
import _ from "lodash"
import dayjs from "dayjs"
import Big from "big.js"

import { ranks } from "./data/ranks.js"

import { getCache, setCache } from "./cache.js"
import { truncate } from "./lib/utils.js"
import { fetchActivities, getNearUsd, publishToDiscord } from "./lib/api.js"

dotenv.config()

const INTERVAL_TIME_MS = 300000

async function runSalesBot() {
  console.log(`starting ${process.env.COLLECTION_ID} sales bot...`)

  setInterval(async () => {
    const lastSaleTime =
      getCache("lastSaleTime", null) ||
      dayjs().startOf("minute").subtract(59, "seconds").valueOf()

    console.log(
      `Last sale in Unix timestamp (seconds): ${getCache("lastSaleTime", null)}`
    )

    const activities = await fetchActivities(process.env.COLLECTION_ID)

    // conditional to check if there's data from api
    if (activities && activities.status === 1) {
      const currentNearPrice = await getNearUsd()

      const salesData = activities.data

      // cached for latest sales
      setCache("lastSaleTime", salesData[0].issued_at)

      const recentSales = _.filter(
        salesData,
        (activity) => activity.issued_at < lastSaleTime
      )

      if (_.isArray(recentSales)) {
        console.log(`${recentSales.length} sales since the last one...`)

        // sort and publish from old to most recent
        const sortedSaleData = _.orderBy(recentSales, "issued_at", "asc")

        for (const sale of sortedSaleData) {
          try {
            const metadata = sale.data[0].metadata
            const msg = sale.msg
            const price = Big(msg.params.price)
              .div(10 ** 24)
              .toFixed()
            const tokenId = parseInt(msg.params.token_id)
            const rank = ranks[tokenId].rank

            const publishData = {
              title: metadata.title,
              seller: truncate(msg.params.owner_id),
              buyer: truncate(msg.params.buyer_id),
              price: price,
              priceUSD: (price * currentNearPrice).toFixed(2),
              rank: rank,
              imageURL: metadata.media,
              date: msg.datetime,
            }

            await publishToDiscord(process.env.WEBHOOK_URL, publishData)
          } catch (err) {
            console.log("error while going through sales data: ", err)
          }
        }
      }
    }
  }, INTERVAL_TIME_MS)
}

runSalesBot()
