// Existing purchases keep their payment and ownership data and receive the current release.
export const ROBLOX_RELEASE = Object.freeze({
  productName: 'Ibuki Roblox Screens V.2.0.0',
  fileName: 'Ibuki Roblox Screens V.2.0.0.zip',
  fileSize: '24.6 MB',
  downloadUrl: 'https://raw.githubusercontent.com/ibuki2433/ibukihub-store/main/server/storage/downloads/Ibuki%20Roblox%20Screens%20V.2.0.0.zip'
});

export function latestRobloxOrder(order) {
  return order.productId === 'prod_roblox_screens'
    ? { ...order, ...ROBLOX_RELEASE }
    : order;
}
