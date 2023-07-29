import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { LSPluginBaseInfo, PageEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
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

    setTimeout(() => {
        observer.observe(parent.document.getElementById("main-content-container") as HTMLDivElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ["class"],
        });
        observer.observe(parent.document.getElementById("right-sidebar") as HTMLDivElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ["class"],
        });
    }, 10);


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
let processingTitleQuery: boolean = false;
const titleQuerySelector = () => {
    if (processingTitleQuery === true) return;
    processingTitleQuery = true;
    parent.document.querySelectorAll(queryAll).forEach((element) => abbreviateNamespace(element as HTMLElement))
    processingTitleQuery = false;
};


function abbreviateNamespace(namespaceRef: HTMLElement) {
    if (!namespaceRef || (namespaceRef.dataset!.origText)) return;
    const text = namespaceRef.textContent;
    if (!text || !text.includes("/")) return;//textに「/」が含まれているかどうか
    // Perform collapsing.

    const splitText = text.split('/') as Array<string>;
    const abbreviatedText = abbreviated(splitText, logseq.settings!.booleanUseDot === true ? ".." : "") as string;
    if (abbreviatedText === text) return;
    console.log(abbreviatedText);
    if (logseq.settings!.iconMode !== "false" && !namespaceRef.dataset.icon) getIcon(namespaceRef, splitText[0] as string);
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


const getIcon = async (namespaceRef, parent: string): Promise<void> => {
    const page = await logseq.Editor.getPage(parent) as PageEntity;
    if (page && page.properties?.icon) {
        namespaceRef.insertAdjacentHTML("beforebegin", page.properties.icon as string);
        namespaceRef.dataset.icon = page.properties.icon as string;
    }

};

const abbreviated = (text: Array<string>, dot: string): string =>
    text.map((part, index, arr) => {
        //数字は除外(日付)
        //partに「Fri, 2023」のように曜日と年がある場合は除外
        if (/^\d+$/.test(part)
            || /, \d+$/.test(part)) {
            return part;
        } else
            if (logseq.settings!.iconMode === "icon only" && index === 0) {
                return "";
            } else
                if (index === arr.length - 1
                    || (
                        logseq.settings!.eliminatesLevels === "2 levels"
                        && index === arr.length - 2
                    )
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
                    switch (logseq.settings!.firstLetter) {
                        case "The first letter":
                            if (part.length <= 1) return part;//1文字の場合はdotをつけない
                            return part.charAt(0) + dot;
                        case "Abbreviate(..)":
                            return "..";
                        case "The first 2 letters":
                            if (part.length <= 2) return part;//2文字未満の場合はdotをつけない
                            return part.substring(0, 2) + dot;
                        case "The first 3 letters":
                            if (part.length <= 3) return part;
                            return part.substring(0, 3) + dot;
                        case "The first 4 letters":
                            if (part.length <= 4) return part;
                            return part.substring(0, 4) + dot;
                        default:
                            return part;
                    }
                }
    }).join('/');

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
    {//Enable Icon mode
        key: "iconMode",
        type: "enum",
        //先頭の親ページのみアイコンを表示す親
        title: "Enable display icon only for the first parent page",
        default: "true",
        enumChoices: ["false", "icon only", "icon and text"],
        description: "default: true",
    },
];

logseq.ready(main).catch(console.error);