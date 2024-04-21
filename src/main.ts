import jetpack from "fs-jetpack";
import { Plugin, TFile, parseYaml } from "obsidian";
import bangumiApi from "./lib/bangumiApi";
import { parseEpisode } from "./lib/parser";
import { AnimeParserSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AnimeParserSettingTab } from "./settings/settingsTab";
import { pos2EditorRange, tFrontmatter, templateWithVariables } from "./utils/obsidianUtils";
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
		this.addCommand({
			id: "play the anime",
			name: "Play the anime from current episode",
			callback: async () => {
				await this.playAnime(this.app.workspace.getActiveFile());
			},
		});
		this.addCommand({
			id: "sync the bangumi",
			name: "Sync the progress of current anime to bangumi",
			callback: async () => {
				await this.syncBangumi(this.app.workspace.getActiveFile());
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
		const videos2 = parseEpisode(videos);

		const content = videos2
			.map(
				(video, index) =>
					`- [ep${index + 1}. ${episodeNames[index]}](${video.replaceAll(" ", "%20")})`
			)
			.join("\n");

		const variables = {
			cover: cover,
			id: id,
			summary: summary.replaceAll(/\n/g, ""),
			tags: tags,
			epNum: episodes.length,
		};
		const notePath = this.settings.savePath
			? new Path("/",this.settings.savePath,name).withSuffix("md").string
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

	async playAnime(currentFile: TFile) {
		const frontmatter = this.app.metadataCache.getFileCache(currentFile)?.frontmatter;
		const progress = frontmatter["progress"];

		const items = this.app.metadataCache.getFileCache(currentFile).listItems;
		const itemContexts = items.map((item) =>
			this.app.workspace.activeEditor.editor.getRange(
				pos2EditorRange(item.position).from,
				pos2EditorRange(item.position).to
			)
		);
		const paths = itemContexts.map((item) => item.match(new RegExp("\\((.*?)\\)"))[1]);

		const videoUrl = paths[progress];
		await this.app.workspace.getLeaf().setViewState({
			type: "mx-url-video",
			state: {
				source: `file:///${videoUrl}`,
			},
		});
	}

	async syncBangumi(currentFile: TFile) {
		const frontmatter = this.app.metadataCache.getFileCache(currentFile)?.frontmatter;
		const progress = frontmatter["progress"];
		const id = frontmatter["bangumiID"];
		await bangumiApi.updateProgress(this.settings.accessToken, id, progress);
	}
}
