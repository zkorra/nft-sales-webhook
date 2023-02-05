const axios = require('axios')

function getNearUsd() {
  return axios
    .get(
      'https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd'
    )
    .then((response) => response.data.near.usd)
}

module.exports = {
  getNearUsd: getNearUsd,
}
