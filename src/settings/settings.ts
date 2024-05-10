export interface AnimeParserSettings {
	libraryPath: string;
	savePath: string;
	propertysTemplate: string;
	notePropertysTemplate: string;
	accessToken: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	libraryPath: "",
	savePath: "",
	propertysTemplate: "playlist: true\ncover: {{cover}}\nbangumiID: {{id}}\nepisodeNum: {{epNum}}\nprogress: 0",
	notePropertysTemplate: "video: {{url}}",
	accessToken: ""
};
