import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { LSPluginBaseInfo, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
//import { setup as l10nSetup, t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
//import ja from "./translations/ja.json";
let restore: Boolean = false;


/* main */
const main = () => {
    // (async () => {
    //     try {
    //         await l10nSetup({ builtinTranslations: { ja } });
    //     } finally {
    /* user settings */
    logseq.useSettingsSchema(settingsTemplate());
    if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300);
    //     }
    // })();


    logseq.App.onRouteChanged(async () => {
        setTimeout(() => titleQuerySelector(), 200);
    });


    logseq.App.onSidebarVisibleChanged(async ({ visible }) => {
        if (visible === true) setTimeout(() => titleQuerySelector(), 300);
    });

    observer.observe(parent.document.getElementById("main-content-container") as HTMLDivElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class"],
    });


    logseq.onSettingsChanged((newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {
        //更新されたら
        if (newSet !== oldSet) restoreAllNamespaces();
    });
    logseq.beforeunload(async () => {
        restoreAllNamespaces();
        restore = true;
    });

};/* end_main */


const observer = new MutationObserver(() => titleQuerySelector());
const queryAll = 'div:is(#main-content-container,#right-sidebar) a[data-ref*="/"],div#left-sidebar li[data-ref*="/"] span.page-title';

//.recent-item[data-ref*="/"],
//div.kef-ae-fav-item-name[title*="/"],
const titleQuerySelector = () => parent.document.querySelectorAll(queryAll).forEach((element) => abbreviateNamespace(element as HTMLElement));


function abbreviateNamespace(namespaceRef: HTMLElement) {
    if (!namespaceRef || (namespaceRef.dataset!.origText)) return;
    const text = namespaceRef.textContent;
    if (!text || !text.includes("/")) return;//textに「/」が含まれているかどうか
    // Perform collapsing.
    let dot = "";
    if (logseq.settings!.booleanUseDot === true) dot = "..";
    const abbreviatedText = (text.split('/')).map((part, index, arr) => {
        //数字は除外(日付)
        //partに「Fri, 2023」のように曜日と年がある場合は除外
        if (/^\d+$/.test(part)
            || /, \d+$/.test(part)
            || index === arr.length - 1
            || (logseq.settings!.eliminatesLevels === "2 levels"
                && index === arr.length - 2)
            || (
                logseq.settings!.eliminatesLevels === "3 levels"
                && (
                    index === arr.length - 2
                    || index === arr.length - 3
                )
            )
        ) {
            return part;
        } else {
            //if (index === 0 && namespaceRef.classList.contains("tag")) {
            if (logseq.settings!.firstLetter === "The first letter") {
                //1文字の場合はdotをつけない
                if (part.length <= 1) return part;
                return part.charAt(0) + dot;
            } else if (logseq.settings!.firstLetter === "Abbreviate(..)") {
                return "..";
            } else if (logseq.settings!.firstLetter === "The first 2 letters") {
                //2文字未満の場合はdotをつけない
                if (part.length <= 2) return part;
                return part.substring(0, 2) + dot;
            } else if (logseq.settings!.firstLetter === "The first 3 letters") {
                if (part.length <= 3) return part;
                return part.substring(0, 3) + dot;
            } else if (logseq.settings!.firstLetter === "The first 4 letters") {
                if (part.length <= 4) return part;
                return part.substring(0, 4) + dot;
            } else {
                return part;
            }
        }
    }).join('/');
    if(abbreviatedText === text) return;
    namespaceRef.dataset.origText = text || "";
    namespaceRef.textContent = abbreviatedText;
    const enterHandler = () => {
        if (restore === false) {
            namespaceRef.textContent = namespaceRef.dataset.origText || "";
        } else if (restore === true) {
            //イベントリスナーを削除
            namespaceRef.removeEventListener('mouseenter', enterHandler);
        }
    };
    const leaveHandler = () => {
        if (restore === false) {
            namespaceRef.textContent = abbreviatedText;
        } else if (restore === true) {
            //イベントリスナーを削除
            namespaceRef.removeEventListener('mouseleave', leaveHandler);
        }
    };
    // Show entire string on hover
    namespaceRef.addEventListener('mouseenter', enterHandler);
    namespaceRef.addEventListener('mouseleave', leaveHandler);
}


//元に戻す
function restoreAllNamespaces() {
    parent.document.querySelectorAll(queryAll).forEach((element) => restoreNamespace(element as HTMLElement));
}

function restoreNamespace(namespaceRef: HTMLElement) {
    if (namespaceRef && namespaceRef.dataset!.origText) {
        namespaceRef.textContent = namespaceRef.dataset.origText;
        delete namespaceRef.dataset.origText;
    }
}


/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
const settingsTemplate = (): SettingSchemaDesc[] => [
    {
        //option for first letter of Root page name
        key: "firstLetter",
        type: "enum",
        enumChoices: ["Abbreviate(..)", "The first letter", "The first 2 letters", "The first 3 letters", "The first 4 letters"],
        title: "Show First letter of Root page name",
        default: "The first 2 letters",
        description: "default: The first 2 letters",
    },
    {
        //Eliminates hierarchies of more than two levels
        key: "eliminatesLevels",
        type: "enum",
        enumChoices: ["1 level", "2 levels", "3 levels"],
        title: "Eliminates hierarchies of more than 2 levels",
        default: "2 levels",
        description: "default: 2 levels",
    },
    {
        //Use dot instead of slash
        key: "booleanUseDot",
        type: "boolean",
        title: "Use dot instead",
        default: true,
        description: "default: true",
    },
];

logseq.ready(main).catch(console.error);