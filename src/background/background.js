// background.js – Configure the side panel behavior for KAP.ai Enhanced and
// track AI usage to fuel the sobriety bar.

const AI_DETECTION_URLS = [
  '*://chat.openai.com/*',
  '*://api.openai.com/*',
  '*://*.openai.com/*',
  '*://*.ai.com/*',
  '*://bard.google.com/*',
  '*://*.bard.google.com/*',
  '*://claude.ai/*',
  '*://*.claude.ai/*',
  '*://*.anthropic.com/*',
  '*://perplexity.ai/*',
  '*://*.perplexity.ai/*',
  '*://*.poe.com/*',
  '*://*.copilot.microsoft.com/*',
];

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const AI_USAGE_INCREMENT_ML = 50;
const FULL_CAPACITY_ML = 50_000;
const DETECTION_COOLDOWN_MS = 60 * 1000;

const recentDetections = new Map();

const getStorage = (keys) =>
  new Promise((resolve) => chrome.storage.local.get(keys, (res) => resolve(res || {})));

const setStorage = (values) =>
  new Promise((resolve) => chrome.storage.local.set(values, resolve));

const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Start on Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
};

const ensureWeeklyReset = async () => {
  const { weeklyResetAt = 0, weeklyWaterMl = 0 } = await getStorage({ weeklyResetAt: 0, weeklyWaterMl: 0 });
  const now = Date.now();
  const currentWeekStart = getWeekStart();
  const needsReset = !weeklyResetAt || now - weeklyResetAt >= WEEK_IN_MS || weeklyResetAt < currentWeekStart;
  if (needsReset) {
    await setStorage({ weeklyResetAt: currentWeekStart, weeklyWaterMl: 0 });
    return { weeklyResetAt: currentWeekStart, weeklyWaterMl: 0 };
  }
  return { weeklyResetAt, weeklyWaterMl };
};

const incrementWaterUsage = async (incrementMl = AI_USAGE_INCREMENT_ML) => {
  const { weeklyResetAt } = await ensureWeeklyReset();
  const { weeklyWaterMl = 0 } = await getStorage({ weeklyWaterMl: 0 });
  const updated = Math.min(weeklyWaterMl + incrementMl, FULL_CAPACITY_ML);
  await setStorage({ weeklyWaterMl: updated, weeklyResetAt });
};

const shouldCountDetection = (key) => {
  const now = Date.now();
  const last = recentDetections.get(key) || 0;
  if (now - last < DETECTION_COOLDOWN_MS) return false;
  recentDetections.set(key, now);
  return true;
};

const isAiUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return AI_DETECTION_URLS.some((pattern) => {
      const domain = pattern.replace(/^[*]:\/\//, '').replace(/\/*$/, '').replace('*.', '');
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch (e) {
    return false;
  }
};

const handleDetection = async (identifier) => {
  if (!shouldCountDetection(identifier)) return;
  await incrementWaterUsage();
};

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
  ensureWeeklyReset();
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    const key = details.initiator || details.documentId || details.tabId || 'global';
    handleDetection(`req:${key}`);
  },
  { urls: AI_DETECTION_URLS }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && isAiUrl(tab.url)) {
    handleDetection(`tab:${tabId}`);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab?.url && isAiUrl(tab.url)) {
      handleDetection(`tab:${activeInfo.tabId}:active`);
    }
  });
});