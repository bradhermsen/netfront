// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const os = require("os");

// Detect Wi-Fi IPv4 address only
function getWifiIp() {
  const interfaces = os.networkInterfaces();
  console.log("🔍 Available network interfaces:", interfaces);

  for (const name of Object.keys(interfaces)) {
    // Skip virtual adapters
    if (
      name.toLowerCase().includes("virtual") ||
      name.toLowerCase().includes("vm") ||
      name.toLowerCase().includes("hyper") ||
      name.toLowerCase().includes("docker") ||
      name.toLowerCase().includes("vbox") ||
      name.toLowerCase().includes("bridge") ||
      name.toLowerCase().includes("loopback")
    ) {
      continue;
    }

    // Prefer Wi-Fi adapters
    if (
      !name.toLowerCase().includes("wi-fi") &&
      !name.toLowerCase().includes("wifi")
    ) {
      continue;
    }

    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "localhost";
}

const lanIp = getWifiIp();
console.log("🔵 Metro Wi-Fi IP:", lanIp);

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  port: 8081,
  host: lanIp,
};

module.exports = config;
