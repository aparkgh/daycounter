chrome.runtime.onInstalled.addListener(async function () {
  chrome.action.onClicked.addListener(function (activeTab) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("/index.html"),
    });
  });
});
