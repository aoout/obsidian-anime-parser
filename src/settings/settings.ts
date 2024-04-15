export interface AnimeParserSettings {
	libraryPath: string;
	savePath: string;
	propertysTemplate: string;
	accessToken: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	libraryPath: "",
	savePath: "",
	propertysTemplate: "cover: {{cover}}\nbangumiApi: {{id}}",
	accessToken: ""
};
