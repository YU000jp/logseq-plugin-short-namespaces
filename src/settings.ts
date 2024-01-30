import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
    

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = (): SettingSchemaDesc[] => [
    {
        //option for first letter of Root page name
        key: "firstLetter",
        type: "enum",
        enumChoices: ["Abbreviate(..)", "The first letter", "The first 2 letters", "The first 3 letters", "The first 4 letters"],
        title: t("Show First letter of Root page name"),
        default: "The first 2 letters",
        description: "default: The first 2 letters",
    },
    {
        //Eliminates hierarchies of more than two levels
        key: "eliminatesLevels",
        type: "enum",
        enumChoices: ["All levels","1 level", "2 levels", "3 levels"],
        title: t("From what level should omit hierarchy?"),
        default: "2 levels",
        description: "default: 2 levels",
    },
    {
        //Use dot instead of slash
        key: "booleanUseDot",
        type: "boolean",
        title: t("Show abbreviations with dots (..) or nothing"),
        default: true,
        description: "default: true",
    },
    {
        key: "iconMode",
        type: "enum",
        //先頭の親ページのみアイコンを表示
        title: t("Enable display the specified icon on the first parent page"),
        default: false,
        enumChoices: ["false", "icon and text"], //icon only
        description: t("⚠️need to restart Logseq to take effect"),
    },
]
