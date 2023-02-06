const cache = {}

export function getCache(key) {
  return cache[key]
}

export function setCache(key, value) {
  cache[key] = value
}
