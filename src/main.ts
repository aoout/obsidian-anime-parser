import { Plugin, parseYaml } from "obsidian";
import { AnimeParserModal } from "./modal";
import { Path } from "./utils/path";
import jetpack from "fs-jetpack";
import { request2, tFrontmatter, templateWithVariables } from "./utils/obsidianUtils";
import { AnimeParserSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AnimeParserSettingTab } from "./settings/settingsTab";
import { parseEpisode } from "./lib/parser";

export default class AnimeParserPlugin extends Plugin {
	settings: AnimeParserSettings;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AnimeParserSettingTab(this.app, this));
		this.addCommand({
			id: "anime-parsing",
			name: "Parse a local directory to a anime",
			callback: () => {
				new AnimeParserModal(this.app, async (input) => {
					await this.parseAnime(input);
				}).open();
			},
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async parseAnime(path: string) {
		const name = new Path(path).name;

		const data = await request2("https://api.bgm.tv/v0/search/subjects", "POST", {
			keyword: name,
			filter: {
				type: [2],
			},
		});

		const id = data["data"][0]["id"];

		const anime = await request2(`https://api.bgm.tv/v0/subjects/${id}`, "GET");

		const cover = anime["images"]["common"];
		const summary = anime["summary"];
		const tags = anime["tags"].map((tag) => tag["name"]);

		const episodes = await request2("https://api.bgm.tv/v0/episodes", "GET", {
			subject_id: id,
			type: 0,
		});
		const episodeNames = episodes["data"].map((ep) => ep["name_cn"]);

		const videos = parseEpisode(jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false }));

		const content = videos
			.map(
				(video, index) =>
					`- [ep${index + 1}. ${episodeNames[index]}](${video.replaceAll(" ", "%20")})`
			)
			.join("\n");

		const variables = {
			cover: cover,
			summary: summary.replaceAll(/\n/g, ""),
			tags: tags,
		};

		await this.app.vault.create(
			this.settings.savePath + "/" + name + ".md",
			tFrontmatter(
				parseYaml(templateWithVariables(this.settings.propertysTemplate, variables))
			) +
				"\n" +
				content
		);
	}
}
