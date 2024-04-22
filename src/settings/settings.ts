export interface AnimeParserSettings {
	libraryPath: string;
	savePath: string;
	regularizedTitle: boolean;
	propertysTemplate: string;
	accessToken: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	libraryPath: "",
	savePath: "",
	regularizedTitle: false,
	propertysTemplate: "cover: {{cover}}\nbangumiApi: {{id}}",
	accessToken: ""
};
