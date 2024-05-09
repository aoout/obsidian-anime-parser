import jetpack from "fs-jetpack";
import { Menu, Notice, Plugin, TFile, parseYaml } from "obsidian";
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
		this.registerMarkdownPostProcessor((element, context) => {
			const noteFile = this.app.vault.getFileByPath(context.sourcePath);
			const frontmatter = this.app.metadataCache.getFileCache(noteFile).frontmatter;
			if (frontmatter?.bangumiID) {
				const lists = element.findAll("ul, ol");

				lists.forEach((list) => {
					const listItems = list.findAll("li");
					console.log(listItems);
					const numRows = Math.ceil(listItems.length / 3);

					const wrapper = createWrapper();
					for (let i = 0; i < numRows; i++) {
						const row = createRow();
						for (let j = 0; j < 3; j++) {
							const index = i * 3 + j;
							const listItem = listItems[index];
							if (listItem) {
								const progress = frontmatter.progress;
								const listItemWrapper = createListItemWrapper(
									progress,
									listItem,
									index
								);
								listItemWrapper.addEventListener("click", () => {
									handleCardClick(this, listItem);
								});
								listItemWrapper.addEventListener("contextmenu", (event) => {
									event.preventDefault();
									handleCardRightClick(this, listItem, event, index);
								});
								row.appendChild(listItemWrapper);
							}
						}
						wrapper.appendChild(row);
					}
					list.replaceWith(wrapper);
				});
			}

			function createWrapper() {
				const wrapper = document.createElement("div");
				wrapper.style.display = "flex";
				wrapper.style.flexWrap = "wrap";
				return wrapper;
			}

			function createRow() {
				const row = document.createElement("div");
				row.style.display = "flex";
				row.style.justifyContent = "space-between";
				row.style.width = "100%";
				row.style.marginBottom = "5px";
				return row;
			}

			function createListItemWrapper(progress, listItem, index) {
				const listItemWrapper = document.createElement("a");
				listItemWrapper.style.flex = "0 0 calc(33.33% - 10px)";
				listItemWrapper.style.padding = "5px";
				listItemWrapper.style.border = "1px solid #ccc";
				listItemWrapper.style.boxSizing = "border-box";
				listItemWrapper.textContent = listItem.innerText;

				if (index < progress) {
					listItemWrapper.style.backgroundColor = "rgb(72, 151, 255)";
					listItemWrapper.style.color = "white";
				} else {
					listItemWrapper.style.backgroundColor = "rgb(218, 234, 255)";
					listItemWrapper.style.color = "rgb(0, 102, 204)";
				}

				return listItemWrapper;
			}
			async function handleCardClick(plugin, listItem) {
				const url = listItem.childNodes[1].ariaLabel;

				await plugin.app.workspace.getLeaf().setViewState({
					type: "mx-url-video",
					state: {
						source: url,
					},
				});
			}
			function handleCardRightClick(plugin: AnimeParserPlugin, listItem, event, index) {
				const menu = new Menu();
				menu.addItem((item) =>
					item
						.setTitle("打开笔记")
						.setIcon("pen")
						.onClick(async () => {
							const commentFolder =
								plugin.settings.savePath + "/" + noteFile.basename;
							const commentPath = commentFolder + "/" + listItem.innerText + ".md";
							const url = listItem.childNodes[1].ariaLabel;

							if (!plugin.app.vault.getAbstractFileByPath(commentFolder)) {
								await plugin.app.vault.createFolder(commentFolder);
							}
							if (!plugin.app.vault.getAbstractFileByPath(commentPath)) {
								await plugin.app.vault.create(
									commentPath,
									tFrontmatter(
										parseYaml(
											templateWithVariables(plugin.settings.notePropertysTemplate,{
												url: url,
												title: noteFile.basename
											})
										)
									)
								);
							}
							const activeLeaf = plugin.app.workspace.getLeaf();
							activeLeaf.setViewState({
								type: "markdown",
								state: {
									file: commentPath,
									mode: "source",
									backlinks: false,
									source: false,
								},
							});
						})
				);
				menu.addItem((item) =>
					item
						.setTitle("看到这集")
						.setIcon("eye")
						.onClick(() => {
							const progress = frontmatter.progress;
							plugin.app.vault.process(noteFile, (data) =>
								data.replace(`progress: ${progress}`, `progress: ${index + 1}`)
							);
						})
				);
				menu.showAtMouseEvent(event);
			}
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
		const path = this.settings.libraryPath + "/" + name;
		const data = await bangumiApi.search(name);
		const id = data["id"];

		const anime = await bangumiApi.getMetadata(id);

		const cover = anime["images"]["common"];
		const summary = anime["summary"];
		const tags = anime["tags"].map((tag) => tag["name"]);

		const episodes = await bangumiApi.getEpisodes(id);
		const episodeNames = episodes.map((ep) => ep["name_cn"]);

		const totalEps = anime["total_episodes"];

		const videos = jetpack.find(this.settings.libraryPath + "/" + name, {
			matching: ["*.mp4", "*.mkv"],
			recursive: false,
		});

		function generatePaddedSequence(maxValue: number): string[] {
			const maxLength = maxValue.toString().length;

			return Array.from({ length: maxValue }, (_, i) =>
				(i + 1).toString().padStart(maxLength, "0")
			);
		}

		const theList = generatePaddedSequence(totalEps);

		const oVideos = videos.filter((video) => !theList.includes(new Path(video).stem));

		let videos3 = null;
		let videos4 = null;
		let yes = false;
		if (oVideos.length == videos.length) {
			yes = true;
			videos3 = parseEpisode(videos, 1);
			for (let i = 0; i < videos3.length; i++) {
				jetpack.rename(videos3[i], theList[i] + "." + new Path(videos3[i]).suffix);
			}
			videos4 = jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false });
		} else if (oVideos.length != 0) {
			yes = true;
			const of = jetpack.find(path, { matching: ["*.of"], recursive: false });
			const pvideos = videos.filter((video) => theList.includes(new Path(video).stem));
			const maxP = pvideos
				.map((video) => parseInt(new Path(video).stem))
				.reduce((a, b) => (a > b ? a : b));
			const videos2 = parseEpisode(oVideos.concat(of), maxP);
			videos3 = [...videos2.slice(1)];
			for (let i = 0; i < oVideos.length; i++) {
				jetpack.rename(videos3[i], theList[maxP + i] + "." + new Path(videos3[i]).suffix);
			}
			videos4 = jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false });
		} else {
			videos4 = jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false });
		}

		if (videos.length < totalEps && yes) {
			jetpack.find(path, { matching: ["*.of"], recursive: false }).forEach(jetpack.remove);
			new Path(videos3.slice(-1)[0]).withSuffix(".of").write("");
		}

		const content = videos4
			.map(
				(video, index) =>
					`- [ep${index + 1}. ${episodeNames[index]}](${
						"mx://animes/" + name + "/" + new Path(video).name.replaceAll(" ", "%20")
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
				source: videoUrl,
			},
		});
	}

	async syncBangumi(currentFile: TFile) {
		const frontmatter = this.app.metadataCache.getFileCache(currentFile)?.frontmatter;
		const progress = frontmatter["progress"];
		if(progress <= 0){
			new Notice("Your watching data is abnormal, please fix it manually");
			return;
		}
		const id = frontmatter["bangumiID"];
		await bangumiApi.updateProgress(this.settings.accessToken, id, progress);
	}
}
