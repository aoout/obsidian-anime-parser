import jetpack from "fs-jetpack";
import { Plugin, parseYaml } from "obsidian";
import bangumiApi from "./lib/bangumiApi";
import { parseEpisode } from "./lib/parser";
import { AnimeParserSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AnimeParserSettingTab } from "./settings/settingsTab";
import { tFrontmatter, templateWithVariables } from "./utils/obsidianUtils";
import { Path } from "./utils/path";

export default class AnimeParserPlugin extends Plugin {
	settings: AnimeParserSettings;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AnimeParserSettingTab(this.app, this));
		this.addCommand({
			id: "sync the animes library",
			name: "Sync the animes library to obsidian",
			callback: async () => {
				await this.syncLibrary();
			},
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async syncLibrary() {
		const animes = jetpack.list(this.settings.libraryPath);
		for (const anime of animes) {
			await this.parseAnime(this.settings.libraryPath + "/" + anime);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	async parseAnime(path: string) {
		const name = new Path(path).name;
		const data = await bangumiApi.search(name);
		const id = data["id"];

		const anime = await bangumiApi.getMetadata(id);

		const cover = anime["images"]["common"];
		const summary = anime["summary"];
		const tags = anime["tags"].map((tag) => tag["name"]);

		const episodes = await bangumiApi.getEpisodes(id);
		const episodeNames = episodes.map((ep) => ep["name_cn"]);

		const videos = jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false });
		const maxLength = videos.length.toString().length;
		const videos2 = parseEpisode(videos);
		videos.forEach((video) => {
			let newName = (videos2.indexOf(video) + 1).toString() + "." + new Path(video).suffix;
			if (new Path(newName).stem.length < maxLength) {
				newName = (maxLength - new Path(newName).stem.length) * 0 + newName;
			}
			if (new Path(video).name != newName) {
				jetpack.rename(video, newName);
			}
		});
		const videos3 = jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false });

		const content = videos3
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
		const notePath = this.settings.savePath
			? this.settings.savePath + "/" + name + ".md"
			: name + ".md";
		if (!this.app.vault.getAbstractFileByPath(notePath)) {
			await this.app.vault.create(
				notePath,
				tFrontmatter(
					parseYaml(templateWithVariables(this.settings.propertysTemplate, variables))
				) +
					"\n" +
					content
			);
		}
	}
}
