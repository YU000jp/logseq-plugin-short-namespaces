import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
    

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = (): SettingSchemaDesc[] => [

    {// 上の階層をグレーアウトするかどうか
        key: "booleanGrayOut",
        type: "boolean",
        title: t("Gray out the upper hierarchies"),
        default: true,
        description: "default: true",
    },
    {
        key: "firstLetter",
        type: "enum",
        enumChoices: ["Abbreviate(..)", "The first letter", "The first 2 letters", "The first 3 letters", "The first 4 letters"],
        // ルートページ名の先頭文字を表示
        title: t("Show First letter of Root page name"),
        default: "The first 2 letters",
        description: "default: The first 2 letters",
    },
    {
        key: "eliminatesLevels",
        type: "enum",
        enumChoices: ["All levels", "1 level", "2 levels", "3 levels"],
        // 何階層以上の階層を省略するか
        title: t("From what level should omit hierarchy?"),
        default: "2 levels",
        description: "default: 2 levels",
    },
    {
        key: "booleanUseDot",
        type: "boolean",
        // ドット(.)を使用して省略
        title: t("Show abbreviations with dots (..) or nothing"),
        default: true,
        description: "default: true",
    },
    {
        key: "booleanIgnoreHash",
        type: "boolean",
         // #が先頭にある場合は省略しない
        title: t("Ignore the abbreviation if the first character is #"),
        default: true,
        description: "default: true",
    },
    {
        key: "iconMode",
        type: "enum",
        // ルートページのアイコン表示
        title: t("Enable display the specified icon on the first parent page"),
        default: false,
        enumChoices: ["false", "icon and text"], //icon only
        // 再起動が必要です
        description: t("⚠️need to restart Logseq to take effect"),
    },
]
