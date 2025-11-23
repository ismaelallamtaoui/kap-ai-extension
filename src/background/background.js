// background.js – Configure the side panel behavior for KAP.ai Enhanced

/*
 * When the extension is installed or updated, configure the side panel so
 * that clicking on the extension's toolbar icon opens the panel instead of
 * doing nothing. Without this call users would need to open the side panel
 * from Chrome's side panel menu. See:
 * https://developer.chrome.com/docs/extensions/reference/api/sidePanel/#methods-setPanelBehavior
 */
chrome.runtime.onInstalled.addListener(() => {
  if (chrome?.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => {
        console.error('Failed to set side panel behavior:', error);
      });
  }
});