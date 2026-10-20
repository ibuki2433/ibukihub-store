// Existing purchases keep their payment and ownership data and receive the current release.
export const ROBLOX_RELEASE = Object.freeze({
  productName: 'Ibuki Roblox Screens V.2.1.2',
  fileName: 'Ibuki Roblox Screens V.2.1.2-Customer.zip',
  fileSize: '24.4 MB',
  downloadUrl: 'https://github.com/ibuki2433/ibukihub-store/releases/download/v2.5.0/Ibuki_Roblox_Screens_V2.1.2_Customer.zip'
});

export function latestRobloxOrder(order) {
  return order.productId === 'prod_roblox_screens'
    ? { ...order, ...ROBLOX_RELEASE }
    : order;
}
