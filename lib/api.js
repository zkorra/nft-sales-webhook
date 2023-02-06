import axios from "axios"
import _ from "lodash"

import { delay } from "./utils.js"

export async function fetchActivities(collectionId) {
  try {
    const response = await axios.get(
      `https://api-v2-mainnet.paras.id/collection-activities?collection_id=${collectionId}&filter=sale`
    )

    return response.data
  } catch (error) {
    console.log("error fetching activities: ", error)
    return []
  }
}

export async function getNearUsd() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd"
    )

    const price = _.isEmpty(response.data.near) ? 0 : response.data.near.usd
    return price
  } catch (error) {
    console.log("error fetching NEAR price: ", error)
    return 0
  }
}

export async function publishToDiscord(
  webHookUrl,
  { title, seller, buyer, price, priceUSD, rank, imageURL, date }
) {
  try {
    await axios.post(webHookUrl, {
      embeds: [
        {
          color: 16568858,
          title: `${title} → SOLD`,
          fields: [
            {
              name: "Sale Price",
              value: `${price} NEAR \`($${priceUSD} USD)\``,
            },
            // {
            //   name: 'Seller',
            //   value: `||${seller}||`,
            //   inline: true,
            // },
            {
              name: "Rank",
              value: `${rank}`,
              inline: true,
            },
            {
              name: "Buyer",
              value: `${buyer}`,
              inline: true,
            },
          ],
          image: {
            url: `${imageURL}`,
          },
          footer: {
            text: "Sold on Paras",
          },
          timestamp: `${date}`,
        },
      ],
    })

    console.log("published:", {
      title,
      seller,
      buyer,
      price,
      priceUSD,
      rank,
      imageURL,
      date,
    })

    await delay(1500)
  } catch (error) {
    console.log("error publishing the sale: ", error)
  }
}
