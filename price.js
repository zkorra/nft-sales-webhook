const axios = require('axios')

function getNear() {
  return axios
    .get(
      'https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd'
    )
    .then((response) => response.data?.near?.usd)
    .catch((error) => {
      console.log(error)
    })
}

module.exports = {
  getNear: getNear,
}
