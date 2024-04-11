export interface AnimeParserSettings {
	libraryPath: string;
	savePath: string;
	propertysTemplate: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	libraryPath: "",
	savePath: "",
	propertysTemplate: "cover: {{cover}}",
};
