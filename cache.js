function get(key) {
  return this.cache[key]
}

function set(key, val) {
  this.cache[key] = val
}

module.exports = {
  cache: {},
  get: get,
  set: set,
}
