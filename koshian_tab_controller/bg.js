
function onError(e) {
    console.error("KOSHIAN_tab_controller/bg.js - " + e.name + ": " + e.message);
    console.dir(e);
}

/**
 * スレへ移動
 * @param {string} url 移動するスレのurl文字列
 * @param {boolean} active 新規に開いたタブをアクティブにするか
 */
function focusOnThread(url, active) {
    browser.tabs.query({url: url})
        .then(tabs => {
            if (tabs[0]) {
                browser.tabs.update(tabs[0].id, {active: true})
                    .catch(createNewTab);
            } else {
                createNewTab();
            }
        })
        .catch(createNewTab);

    function createNewTab() {
        browser.tabs.query({currentWindow: true})
            .then(tabs => {
                let active_index = tabs.findIndex(tab => tab.active);
                let active_id = tabs[active_index].id;
                browser.tabs.create({
                    url: url,
                    active: active,
                    openerTabId: active_id
                });
            })
            .catch(onError);
    }
}

let last_thread_id = null;

/**
 * カタログへ移動
 * @param {string} url 移動するカタログのurlの一部 http(s)://＊.2chan.net/＊/
 */
function focusOnCatalog(url) {
    browser.tabs.query({currentWindow: true})
        .then(tabs => {
            let active_index = tabs.findIndex(tab => tab.active);
            if (active_index > -1) {
                let opener_id = tabs[active_index].openerTabId;
                if (opener_id) {
                    let opener_index = tabs.findIndex(tab => tab.id === opener_id);
                    let regex = new RegExp(`^${url}(futaba\\.php\\?mode=cat|(\\d+|futaba)\\.htm)`);
                    if (opener_index > -1 && regex.test(tabs[opener_index].url)) {  // 親タブがカタログか[n]ページなら移動
                        browser.tabs.update(opener_id, {active: true})
                            .then(() => {
                                last_thread_id = tabs[active_index].id;
                            });
                        return;
                    }
                }
            }
            let normal_tab_id = null;
            let regex = new RegExp(`^${url}(\\d+|futaba).htm`);
            for (let tab of tabs) {
                if (tab.url.indexOf(`${url}futaba.php?mode=cat`) === 0) {
                    // カタログ
                    browser.tabs.update(tab.id, {active: true})
                        .then(() => {
                            last_thread_id = tabs[active_index].id;
                        });
                    return;
                } else if (!normal_tab_id && regex.test(tab.url)) {
                    // [n]ページ
                    normal_tab_id = tab.id;
                }
            }
            if (normal_tab_id) {
                browser.tabs.update(normal_tab_id, {active: true})
                    .then(() => {
                        last_thread_id = tabs[active_index].id;
                    });
            }
        })
        .catch(onError);
}

/**
 * 最後に左ダブルクリックでカタログに移動したスレに移動
 */
function focusOnLastThread() {
    if (last_thread_id) {
        browser.tabs.update(last_thread_id, {active: true})
            .catch(onError);
    }
}

/**
 * 新着レスのあるスレに移動
 */
function focusOnUnreadThread() {
    browser.tabs.query({currentWindow: true})
        .then(tabs => {
            let unread_id = null;
            let catalog_id = null;
            let candidate_id = null;
            let active_index = tabs.findIndex(tab => tab.active);
            for (let i = 0, num = tabs.length; i < num; ++i) {
                let test_res = /^https?:\/\/[^.]+\.2chan\.net\/[^/]+\/res\/\d+\.htm/.test(tabs[i].url);
                if (test_res) {
                    let is_unread = /^(\(\d+\)|#)/.test(tabs[i].title);
                    if (is_unread) {
                        if (i > active_index) {
                            browser.tabs.update(tabs[i].id, {active: true});
                            return;
                        } else if (!unread_id && i !== active_index) {
                            unread_id = tabs[i].id;
                        }
                    }
                } else if (!catalog_id || !candidate_id) {
                    let test_catalog = /^https?:\/\/[^.]+\.2chan\.net\/[^/]+\/(futaba\.php\?mode=cat|(futaba|\d+)\.htm)/.test(tabs[i].url);
                    if (test_catalog) {
                        if (!catalog_id && i > active_index) {
                            catalog_id = tabs[i].id;
                        } else if (!candidate_id && i !== active_index) {
                            candidate_id = tabs[i].id;
                        }
                    }
                }
            }
            let tab_id = unread_id || catalog_id || candidate_id;
            if (tab_id) {
                browser.tabs.update(tab_id, {active: true});
            }
        })
        .catch(onError);
}

function main() {
    browser.runtime.onMessage.addListener((message, sender, response) => {
        switch (message.id) {
            case "KOSHIAN_tab_focus_on_thread":
                focusOnThread(message.url, message.active);
                response();
                break;
            case "KOSHIAN_tab_focus_on_catalog":
                focusOnCatalog(message.url);
                response();
                break;
            case "KOSHIAN_tab_focus_on_last_thread":
                focusOnLastThread();
                response();
                break;
            case "KOSHIAN_tab_focus_on_unread_thread":
                focusOnUnreadThread();
                response();
                break;
        }
    });
}

main();
