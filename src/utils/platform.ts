const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];

export function isMac() {
  return macosPlatforms.includes(window.navigator.platform);
}
