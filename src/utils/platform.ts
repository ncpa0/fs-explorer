const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];

function isMac() {
  return macosPlatforms.includes(window.navigator.platform);
}
