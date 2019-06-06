module.exports = {
  maximumFileSizeToCacheInBytes: 10000000,
  "globDirectory": "dist/",
  "globPatterns": [
    "index.html",
    "**/*.js",
    "**/*.jpg",
    "**/*.ico",
    "**/*.css"

  ],
  "swSrc": "src/sw.js",
  "swDest": "dist/service-worker.js"
};