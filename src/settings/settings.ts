export interface AnimeParserSettings {
	libraryPath: string;
	savePath: string;
	propertysTemplate: string;
	accessToken: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	libraryPath: "",
	savePath: "",
	propertysTemplate: "playlist: true\ncover: {{cover}}\nbangumiApi: {{id}}\nepisodeNum: {{epNum}}\nprogress: 0",
	accessToken: ""
};
