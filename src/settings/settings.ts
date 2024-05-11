export interface AnimeParserSettings {
	libraryPath: string;
	savePath: string;
	yamlTemplate: string;
	noteYamlTemplate: string;
	accessToken: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	libraryPath: "",
	savePath: "",
	yamlTemplate: "playlist: true\ncover: {{cover}}\nbangumiID: {{id}}\nepisodeNum: {{epNum}}\nprogress: 0",
	noteYamlTemplate: "video: {{url}}",
	accessToken: ""
};
