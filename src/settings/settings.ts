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
	propertysTemplate: "playlist: true\ncover: {{cover}}\nbangumiApi: {{id}}\nepisodeNum: {{epNum}}\nprogress: 0",
	accessToken: ""
};
