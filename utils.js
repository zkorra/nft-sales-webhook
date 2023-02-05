function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function truncate(string, limit = 14) {
  return string.length > limit ? `${string.substr(0, limit)}...` : string
}

module.exports = {
  delay: delay,
  truncate: truncate,
}
