const form_selectors = 
    "#ftbl," +      // 返信フォーム
    "a," +          // aタグ
    "img," +        // imgタグ
    "input," +      // inputタグ
    "textarea," +   // textareaタグ
    "label," +      // labelタグ
    "#ddbut," +      // [見る][隠す]ボタン
    "form[name='delform2']," +  // 削除フォーム
    ".futaba_lightbox, .fancybox-overlay, .fancybox-wrap," +    // futaba lightbox
    "";

const DEFAULT_OPEN_NEW_THREAD_IN_BG = false;
const DEFAULT_USE_DOUBLECLICK = false;
const DEFAULT_DISABLE_FORMS = true;
const DEFAULT_DISABLE_CLASS_RTD = false;
const DEFAULT_FOCUS_ON_UNREAD = false;
const DEFAULT_CLICK_PERIOD = 350;
const DEFAULT_LONG_PRESS_TIME = 0;
const DEFAULT_DOUBLECLICK_PERIOD = 300;

let open_new_thread_in_bg = DEFAULT_OPEN_NEW_THREAD_IN_BG;
let use_doubleclick = DEFAULT_USE_DOUBLECLICK;
let disable_forms = DEFAULT_DISABLE_FORMS;
let disable_class_rtd = DEFAULT_DISABLE_CLASS_RTD;
let focus_on_unread = DEFAULT_FOCUS_ON_UNREAD;
let click_period = DEFAULT_CLICK_PERIOD;
let long_press_time = DEFAULT_LONG_PRESS_TIME;
let doubleclick_period = DEFAULT_DOUBLECLICK_PERIOD;
let exclusion = "";
let ctrl_key = false;

function onError(e) {
    console.error("KOSHIAN_tab_controller/res.js - " + e.name + ": " + e.message);
    console.dir(e);
}

function onDoubleClick(e) {
    if (use_doubleclick && e.button === 0) {
        if (exclusion && e.target.closest(exclusion)) {
            return;
        }
        focusOnCatalog();
        removeSelection();
    }
}

/**
 * カタログへ移動
 */
function focusOnCatalog() {
    let url = location.protocol + "//" + location.host + location.pathname.replace(/res\/\d+\.htm.*/, "");
    browser.runtime.sendMessage({
        id: "KOSHIAN_tab_focus_on_catalog",
        url: url
    });
}

/**
 *  ダブルクリックで選択された部分を解除する
 */
function removeSelection() {
    let sel_obj = document.getSelection();
    if (sel_obj) {
        sel_obj.removeAllRanges();

        // KOSHIAN 引用をポップアップで表示 改の選択文字列ポップアップの赤字を解除
        let e = document.createEvent("MouseEvents");
        e.initEvent("mousedown", true, true );  // event type, bubbling, cancelable
        document.body.dispatchEvent(e);
    }
}

function onClick(e) {
    if (e.button !== 0) {
        return;
    }
    findAnchor(e);
}

/**
 * 直近の祖先のaタグを探索してリンク先がレスなら開く
 * @param {Object} e MouseEventオブジェクト
 */
function findAnchor(e) {
    let anchor = e.target.closest("a");
    if (anchor) {
        let href = anchor.href;
        if (href && /\/res\/\d+\.htm/.test(href)) {
            e.preventDefault();
            let active = !((open_new_thread_in_bg || ctrl_key) && !(open_new_thread_in_bg && ctrl_key));
            browser.runtime.sendMessage({
                id: "KOSHIAN_tab_focus_on_thread",
                url: href,
                active: active
            });
        }
    }
}

let count_mb = 0;
let timer_id_mb = null;
let last_doubleclick_time = Date.now();

/**
 * 右クリックをカウント
 */
function countClick() {
    if (focus_on_unread && Date.now() - last_doubleclick_time > doubleclick_period) {
        if (count_mb) {
            count_mb = 0;
            if (timer_id_mb) {
                clearTimeout(timer_id_mb);
            }
            last_doubleclick_time = Date.now();
            focusOnUnreadThread();
        } else {
            ++count_mb;
            timer_id_mb = setTimeout(() => {
                timer_id_mb = null;
                count_mb = 0;
            }, click_period);
        }
    } else {
        count_mb = 0;
    }
}

/**
 * 未読レスがあるスレへ移動
 */
function focusOnUnreadThread() {
    browser.runtime.sendMessage({
        id: "KOSHIAN_tab_focus_on_unread_thread"
    });
}

function onContextmenu(e) {
    if (focus_on_unread && e.button == 2) {
        if (!is_long_press) {
            e.preventDefault();
        }
        countClick();
    }
}

let is_long_press = false;
let time_md = Date.now();

function onMouseDown(e) {
    if (focus_on_unread && e.button == 2) {
        is_long_press = false;
        time_md = Date.now();
    }
}

let time_mu = Date.now();

function onMouseUp(e) {
    if (focus_on_unread && e.button == 2) {
        time_mu = Date.now();
        is_long_press = time_mu - time_md >= long_press_time;
    }
}

function onKeyUpDown(e) {
    ctrl_key = e.ctrlKey || e.metaKey;
}

function main() {
    document.addEventListener("dblclick", onDoubleClick);
    document.addEventListener("click", onClick);
    document.addEventListener("contextmenu", onContextmenu);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyUpDown);
    document.addEventListener("keyup", onKeyUpDown);
}

function onLoadSetting(result) {
    open_new_thread_in_bg = getValueSafety(result.open_new_thread_in_bg, DEFAULT_OPEN_NEW_THREAD_IN_BG);
    use_doubleclick = getValueSafety(result.use_doubleclick, DEFAULT_USE_DOUBLECLICK);
    disable_forms = getValueSafety(result.disable_forms, DEFAULT_DISABLE_FORMS);
    disable_class_rtd = getValueSafety(result.disable_class_rtd, DEFAULT_DISABLE_CLASS_RTD);
    focus_on_unread = getValueSafety(result.focus_on_unread, DEFAULT_FOCUS_ON_UNREAD);
    click_period = Number(getValueSafety(result.click_period, DEFAULT_CLICK_PERIOD));
    long_press_time = Number(getValueSafety(result.long_press_time, DEFAULT_LONG_PRESS_TIME));

    exclusion = "";
    if (use_doubleclick) {
        exclusion = disable_forms ? form_selectors : "";
        exclusion += disable_class_rtd ? ".rtd," : "";
        if (exclusion) {
            exclusion = exclusion.slice(0, -1);
        }
    }

    main();
}

function onSettingChanged(result) {
    open_new_thread_in_bg = getValueSafety(result.open_new_thread_in_bg.newValue, open_new_thread_in_bg);
    use_doubleclick = getValueSafety(result.use_doubleclick.newValue, use_doubleclick);
    disable_forms = getValueSafety(result.disable_forms.newValue, disable_forms);
    disable_class_rtd = getValueSafety(result.disable_class_rtd.newValue, disable_class_rtd);
    focus_on_unread = getValueSafety(result.focus_on_unread.newValue, focus_on_unread);
    click_period = Number(getValueSafety(result.click_period.newValue, click_period));
    long_press_time = Number(getValueSafety(result.long_press_time.newValue, long_press_time));

    exclusion = "";
    if (use_doubleclick) {
        exclusion = disable_forms ? form_selectors : "";
        exclusion += disable_class_rtd ? ".rtd," : "";
        if (exclusion) {
            exclusion = exclusion.slice(0, -1);
        }
    }

}

function getValueSafety(value, default_value) {
    return value === undefined ? default_value : value;
}

browser.storage.local.get().then(onLoadSetting, onError);
browser.storage.onChanged.addListener(onSettingChanged);
