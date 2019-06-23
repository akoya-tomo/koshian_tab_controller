const DEFAULT_OPEN_NEW_THREAD_IN_BG = false;
const DEFAULT_USE_DOUBLECLICK = false;
const DEFAULT_DISABLE_FORMS = true;
const DEFAULT_DISABLE_CLASS_RTD = false;
const DEFAULT_DISABLE_ID_CATTABLE = false;
const DEFAULT_FOCUS_ON_UNREAD = false;
const DEFAULT_CLICK_PERIOD = 350;
const DEFAULT_LONG_PRESS_TIME = 0;

let g_open_new_thread_in_bg = null;
let g_use_doubleclick = null;
let g_disable_forms = null;
let g_disable_class_rtd = null;
let g_disable_id_cattable = null;
let g_focus_on_unread = null;
let g_click_period = null;
let g_long_press_time = null;

/* eslint indent: ["warn", 2] */

function getValueSafely(value, default_value) {
  return value === undefined ? default_value : value;
}

function saveSetting() {
  browser.storage.local.set({
    open_new_thread_in_bg: g_open_new_thread_in_bg.checked,
    use_doubleclick: g_use_doubleclick.checked,
    disable_forms: g_disable_forms.checked,
    disable_class_rtd: g_disable_class_rtd.checked,
    disable_id_cattable: g_disable_id_cattable.checked,
    focus_on_unread: g_focus_on_unread.checked,
    click_period: g_click_period.value,
    long_press_time: g_long_press_time.value
  });
}

function setCurrentChoice(result) {
  g_open_new_thread_in_bg.checked = getValueSafely(result.open_new_thread_in_bg, DEFAULT_OPEN_NEW_THREAD_IN_BG);
  g_use_doubleclick.checked = getValueSafely(result.use_doubleclick, DEFAULT_USE_DOUBLECLICK);
  g_disable_forms.checked = getValueSafely(result.disable_forms, DEFAULT_DISABLE_FORMS);
  g_disable_class_rtd.checked = getValueSafely(result.disable_class_rtd, DEFAULT_DISABLE_CLASS_RTD);
  g_disable_id_cattable.checked = getValueSafely(result.disable_id_cattable, DEFAULT_DISABLE_ID_CATTABLE);
  g_focus_on_unread.checked = getValueSafely(result.focus_on_unread, DEFAULT_FOCUS_ON_UNREAD);
  g_click_period.value = getValueSafely(result.click_period, DEFAULT_CLICK_PERIOD);
  g_long_press_time.value = getValueSafely(result.long_press_time, DEFAULT_LONG_PRESS_TIME);

  g_disable_forms.disabled = !g_use_doubleclick.checked;
  g_disable_class_rtd.disabled = !g_use_doubleclick.checked;
  g_disable_id_cattable.disabled = !g_use_doubleclick.checked;

  g_click_period.disabled = !g_focus_on_unread.checked;
  g_long_press_time.disabled = !g_focus_on_unread.checked;
}

function onLoad() {
  g_open_new_thread_in_bg = document.getElementById("open_new_thread_in_bg");
  g_use_doubleclick = document.getElementById("use_doubleclick");
  g_disable_forms = document.getElementById("disable_forms");
  g_disable_class_rtd = document.getElementById("disable_class_rtd");
  g_disable_id_cattable = document.getElementById("disable_id_cattable");
  g_focus_on_unread = document.getElementById("focus_on_unread");
  g_click_period = document.getElementById("click_period");
  g_long_press_time = document.getElementById("long_press_time");

  g_open_new_thread_in_bg.addEventListener("change", saveSetting);
  g_use_doubleclick.addEventListener("change", () => {
    g_disable_forms.disabled = !g_use_doubleclick.checked;
    g_disable_class_rtd.disabled = !g_use_doubleclick.checked;
    g_disable_id_cattable.disabled = !g_use_doubleclick.checked;
    saveSetting();
  });
  g_disable_forms.addEventListener("change", saveSetting);
  g_disable_class_rtd.addEventListener("change", saveSetting);
  g_disable_id_cattable.addEventListener("change", saveSetting);
  g_focus_on_unread.addEventListener("change", () => {
    g_click_period.disabled = !g_focus_on_unread.checked;
    g_long_press_time.disabled = !g_focus_on_unread.checked;
    saveSetting();
  });
  g_click_period.addEventListener("change", saveSetting);
  g_long_press_time.addEventListener("change", saveSetting);

  browser.storage.local.get().then(setCurrentChoice, onError);
}

function onError(e) {
  console.error("KOSHIAN_tab/options.js - " + e.name + ": " + e.message);
  console.dir(e);
}

document.addEventListener("DOMContentLoaded", onLoad);
