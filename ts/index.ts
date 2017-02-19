///<reference path="../node_modules/@types/jquery/index.d.ts" />
declare const chrome: any;
const storageKey = 'jd-duration';

chrome.storage.sync.get(storageKey, (storageValues: any) => {
    jQuery('#time').val(storageValues[storageKey])
});

jQuery('#time').on('keyup', (element: any) => {
    chrome.storage.sync.set({[storageKey]: element.target.value});
});