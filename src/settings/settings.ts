export interface AnimeParserSettings {
	savePath: string;
	propertysTemplate: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	savePath: "",
	propertysTemplate: "cover: {{cover}}",
};
