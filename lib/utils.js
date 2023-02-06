export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function truncate(string, limit = 14) {
  return string.length > limit ? `${string.substr(0, limit)}...` : string
}
