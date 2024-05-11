import jetpack from "fs-jetpack";
import { Notice, Plugin, TFile, parseYaml } from "obsidian";
import bangumiApi from "./lib/bangumiApi";
import { BangumiMatrix } from "./lib/bangumiMatrix";
import { parseEpisode } from "./lib/parser";
import { AnimeParserSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AnimeParserSettingTab } from "./settings/settingsTab";
import { createNote, pos2EditorRange, tFrontmatter, templateBuild } from "./utils/obsidianUtils";
import { P, Path } from "./utils/path";
import { generatePaddedSequence } from "./utils/utils";
import { open } from "./utils/mediaExtendedUtils";

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
		const path = new Path(this.settings.libraryPath, name).string;

		const { id } = await bangumiApi.search(name);

		const {
			images: { common: cover },
			summary,
			tags: tagNames,
			total_episodes: totalEps,
		} = await bangumiApi.getMetadata(id);

		const tags = tagNames.map((tag) => tag.name);

		const episodes = await bangumiApi.getEpisodes(id);
		const episodeNames = episodes.map((ep) => ep.name_cn);

		const videoExtensions = ["*.mp4", "*.mkv"];

		const videos = jetpack.find(path, { matching: videoExtensions });
		const suffix = P(videos[0]).suffix;

		const epIndexs = generatePaddedSequence(totalEps);
		console.log(epIndexs);

		const unprocessedVideos = videos.filter((video) => !epIndexs.includes(P(video).stem));

		if (unprocessedVideos.length) {
			let parsedVideos;
			const allUnprocessed = unprocessedVideos.length === videos.length;

			if (allUnprocessed) {
				parsedVideos = parseEpisode(videos, 1);
				parsedVideos.forEach((video, i) =>
					jetpack.rename(video, P(epIndexs[i]).withSuffix(suffix).string)
				);
			} else {
				const of = jetpack.find(path, { matching: ["*.of"] });
				const processedVideos = videos.filter((video) => epIndexs.includes(P(video).stem));
				const maxProcessedEpisode = Math.max(
					...processedVideos.map((video) => parseInt(P(video).stem))
				);

				const parsedEpisodes = parseEpisode(
					unprocessedVideos.concat(of),
					maxProcessedEpisode
				);
				parsedVideos = [...parsedEpisodes.slice(1)];

				unprocessedVideos.forEach((_, i) =>
					jetpack.rename(
						parsedVideos[i],
						P(epIndexs[maxProcessedEpisode + i]).withSuffix(suffix).string
					)
				);
			}

			if (videos.length < totalEps) {
				jetpack
					.find(path, { matching: ["*.of"], recursive: false })
					.forEach(jetpack.remove);
				new Path(parsedVideos.slice(-1)[0]).withSuffix(".of").write("");
			}
		}

		const content = generatePaddedSequence(totalEps)
			.slice(0, videos.length)
			.map(
				(video, index) =>
					`- [ep${index + 1}. ${episodeNames[index]}](${
						"mx://animes/" + name.replaceAll(" ", "%20") + "/" + video + "." + suffix
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
			? new Path("/", this.settings.savePath, name).withSuffix("md").string
			: name + ".md";

		await createNote(
			this.app,
			notePath,
			tFrontmatter(parseYaml(templateBuild(this.settings.yamlTemplate, variables))) +
				"\n" +
				content
		);
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
	}
}
