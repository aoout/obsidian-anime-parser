import jetpack from "fs-jetpack";
import { Notice, Plugin, TFile, parseYaml } from "obsidian";
import * as path from "path";
import bangumiApi from "./lib/bangumiApi";
import { BangumiMatrix } from "./lib/bangumiMatrix";
import { parseEpisode } from "./lib/parser";
import { AnimeParserModal } from "./modal";
import { AnimeParserSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AnimeParserSettingTab } from "./settings/settingsTab";
import { open } from "./utils/mediaExtendedUtils";
import { createNote, pos2EditorRange, tFrontmatter, templateBuild } from "./utils/obsidianUtils";
import { generatePaddedSequence } from "./utils/utils";

export default class AnimeParserPlugin extends Plugin {
	settings: AnimeParserSettings;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AnimeParserSettingTab(this.app, this));
		this.addCommand({
			id: "import a anime",
			name: "Import a anime to obsidian",
			callback: async () => {
				new AnimeParserModal(this.app, this.settings.libraryPath, async (result) => {
					await this.parseAnime(result);
				}).open();
			},
		});
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
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return false;
				if (!this.app.metadataCache.getFileCache(activeFile).frontmatter?.bangumiID)
					return false;
				if (checking) return true;
				this.playAnime(activeFile);
				return true;
			},
		});
		this.addCommand({
			id: "sync the bangumi",
			name: "Sync the progress of current anime to bangumi",
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) return false;
				if (!this.app.metadataCache.getFileCache(activeFile).frontmatter?.bangumiID)
					return false;
				if (checking) return true;
				this.syncBangumi(activeFile);
				return true;
			},
		});
		this.registerMarkdownPostProcessor((element, context) => {
			const bangumiMatrix = new BangumiMatrix(this.app, this.settings);
			return bangumiMatrix.process(element, context);
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
			await this.parseAnime(anime);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	async parseAnime(name: string) {
		const animePath = path.join(this.settings.libraryPath, name);

		const { id } = await bangumiApi.search(name);

		const {
			images: { large: cover },
			summary,
			tags: tagNames,
			total_episodes: totalEps,
		} = await bangumiApi.getMetadata(id);

		const tags = tagNames.map((tag) => tag.name);

		const episodes = await bangumiApi.getEpisodes(id);
		const episodeNames = episodes.map((ep) => ep.name_cn);

		const videoExtensions = ["*.mp4", "*.mkv"];

		const videos = jetpack.find(animePath, { matching: videoExtensions });
		const suffix = path.extname(videos[0]);

		const epIndexs = generatePaddedSequence(totalEps);

		const unprocessedVideos = videos.filter(
			(video) => !epIndexs.includes(path.basename(video, suffix))
		);

		if (unprocessedVideos.length) {
			let parsedVideos;
			const allUnprocessed = unprocessedVideos.length === videos.length;

			if (allUnprocessed) {
				parsedVideos = parseEpisode(videos);
				parsedVideos.forEach((video, i) => jetpack.rename(video, epIndexs[i] + suffix));
			} else {
				const of = jetpack.find(animePath, { matching: ["*.of"] });
				const processedVideos = videos.filter((video) =>
					epIndexs.includes(path.basename(video, suffix))
				);
				const maxProcessedEpisode = Math.max(
					...processedVideos.map((video) => parseInt(path.basename(video, suffix)))
				);

				const parsedEpisodes = parseEpisode(
					unprocessedVideos.concat(of)
				);
				parsedVideos = [...parsedEpisodes.slice(1)];

				unprocessedVideos.forEach((_, i) =>
					jetpack.rename(parsedVideos[i], epIndexs[maxProcessedEpisode + i] + suffix)
				);
			}

			if (videos.length < totalEps) {
				jetpack
					.find(animePath, { matching: ["*.of"], recursive: false })
					.forEach(jetpack.remove);
				const ofPath = path.join(
					animePath,
					path.basename(parsedVideos.slice(-1)[0], suffix) + ".of"
				);
				jetpack.write(ofPath, "");
			}
		}

		const content = generatePaddedSequence(totalEps)
			.slice(0, videos.length)
			.map(
				(video, index) =>
					`- [ep${index + 1}. ${episodeNames[index]}](${
						"mx://animes/" + name.replaceAll(" ", "%20") + "/" + video + suffix
					})`
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
			? path.join("/", this.settings.savePath, name + ".md")
			: name + ".md";

		await createNote(
			this.app,
			notePath,
			tFrontmatter(parseYaml(templateBuild(this.settings.yamlTemplate, variables))) +
				"\n" +
				content
		);
		new Notice(`${name}has been imported`);
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

		open(this.app, videoUrl);
	}

	async syncBangumi(currentFile: TFile) {
		const frontmatter = this.app.metadataCache.getFileCache(currentFile)?.frontmatter;
		const progress = frontmatter["progress"];
		if (progress <= 0) {
			new Notice("Your watching data is abnormal, please fix it manually");
			return;
		}
		const id = frontmatter["bangumiID"];
		await bangumiApi.updateProgress(this.settings.accessToken, id, progress);
		new Notice("The progress has been uploaded to bangumi");
	}
}
