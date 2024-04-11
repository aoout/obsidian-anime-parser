export interface AnimeParserSettings {
	propertysTemplate: string;
}

export const DEFAULT_SETTINGS: AnimeParserSettings = {
	propertysTemplate: "cover: {{cover}}",
};
