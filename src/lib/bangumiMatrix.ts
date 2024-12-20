/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, FrontMatterCache, Menu, TFile, parseYaml } from "obsidian";
import * as path from "path";
import { AnimeParserSettings } from "../settings/settings";
import { open } from "../utils/mediaExtendedUtils";
import { createNote, openNote, tFrontmatter, templateBuild } from "../utils/obsidianUtils";

export class BangumiMatrix {
	noteFile: TFile;
	frontmatter: FrontMatterCache;
	constructor(private app: App, private settings: AnimeParserSettings) {}

	async process(element: HTMLElement, context: any) {
		this.noteFile = this.app.vault.getFileByPath(context.sourcePath);
		this.frontmatter = this.app.metadataCache.getFileCache(this.noteFile)?.frontmatter;
		if (this.frontmatter?.bangumiID) {
			const lists = element.findAll("ul, ol");
			lists.forEach((list) => {
				const matrix = this.createMatrixFromList(list, this.frontmatter.progress);
				list.replaceWith(matrix.wrapper);
			});
		}
	}

	private createMatrixFromList(list: HTMLElement, progress: number) {
		const app = this.app;

		const listItems = list.findAll("li");
		const numRows = Math.ceil(listItems.length / 3);
		const eps = createDiv({ cls: "bangumi-matrix-wrapper" });
		for (let i = 0; i < numRows; i++) {
			const row = createDiv({ cls: "bangumi-matrix-row" });
			for (let j = 0; j < 3; j++) {
				const index = i * 3 + j;
				const listItem = listItems[index];
				if (listItem) {
					const url = listItem.childNodes[1]["ariaLabel"];
					const epItem = createEl("a", {
						text: listItem.innerText,
						attr: { url: url, index: index },
						cls: ["bangumi-list-item-wrapper"].concat(
							`${index < progress ? "completed" : "pending"}`
						),
					});
					epItem.addEventListener("click", function () {
						open(app, this.getAttribute("url"));
					});
					epItem.addEventListener("contextmenu", (event) => {
						this.handleCardRightClick(epItem, event);
					});
					row.appendChild(epItem);
				}
			}
			eps.appendChild(row);
		}
		return { wrapper: eps };
	}

	private handleCardRightClick(epItem: HTMLElement, event: MouseEvent) {
		const menu = new Menu();
		menu.addItem((item) =>
			item
				.setTitle("打开笔记")
				.setIcon("pen")
				.onClick(async () => {
					const variables = {
						savePath: this.settings.savePath,
						animeName: this.noteFile.basename,
						episodeName: epItem.getText()
					};
					const commentPath = templateBuild(this.settings.episodeNotePathTemplate, variables);
					const url = epItem.getAttribute("url");

					await createNote(
						this.app,
						commentPath,
						tFrontmatter(
							parseYaml(
								templateBuild(this.settings.noteYamlTemplate, {
									url: url,
									title: this.noteFile.basename,
								})
							)
						)
					);
					openNote(this.app, commentPath);
				})
		);
		menu.addItem((item) =>
			item
				.setTitle("看到这集")
				.setIcon("eye")
				.onClick(() => {
					const progress = this.frontmatter.progress;
					this.app.vault.process(this.noteFile, (data) =>
						data.replace(
							`progress: ${progress}`,
							`progress: ${Number(epItem.getAttribute("index")) + 1}`
						)
					);
				})
		);
		menu.showAtMouseEvent(event);
	}
}
