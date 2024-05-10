/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, Menu, TFile, parseYaml } from "obsidian";
import { AnimeParserSettings } from "../settings/settings";
import { tFrontmatter, templateWithVariables } from "../utils/obsidianUtils";

export class BangumiMatrix {
	noteFile: TFile;
	frontmatter: any;
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
		const listItems = list.findAll("li");
		const numRows = Math.ceil(listItems.length / 3);
		const wrapper = this.createWrapper();
		for (let i = 0; i < numRows; i++) {
			const row = this.createRow();
			for (let j = 0; j < 3; j++) {
				const index = i * 3 + j;
				const listItem = listItems[index];
				if (listItem) {
					const listItemWrapper = this.createListItemWrapper(progress, listItem, index);
					listItemWrapper.addEventListener("click", () => this.handleCardClick(listItem));
					listItemWrapper.addEventListener("contextmenu", (event) => {
						event.preventDefault();
						this.handleCardRightClick(listItem, event, index);
					});
					row.appendChild(listItemWrapper);
				}
			}
			wrapper.appendChild(row);
		}
		return { wrapper };
	}

	private createWrapper() {
		const flexWrapper = document.createElement("div");
		flexWrapper.className = "bangumi-matrix-wrapper";
		return flexWrapper;
	}

	private createRow() {
		const rowDiv = document.createElement("div");
		rowDiv.className = "bangumi-matrix-row";
		return rowDiv;
	}

	private createListItemWrapper(progress: number, listItem: HTMLElement, index: number) {
		const wrapper = document.createElement("a");
		wrapper.classList.add("bangumi-list-item-wrapper");
		wrapper.classList.add(`${index < progress ? "completed" : "pending"}`);
		wrapper.textContent = listItem.innerText;
		return wrapper;
	}

	private async handleCardClick(listItem) {
		const url = listItem.childNodes[1].ariaLabel;

		await this.app.workspace.getLeaf().setViewState({
			type: "mx-url-video",
			state: {
				source: url,
			},
		});
	}
	private handleCardRightClick(listItem, event, index) {
		const menu = new Menu();
		menu.addItem((item) =>
			item
				.setTitle("打开笔记")
				.setIcon("pen")
				.onClick(async () => {
					const commentFolder = this.settings.savePath + "/" + this.noteFile.basename;
					const commentPath = commentFolder + "/" + listItem.innerText + ".md";
					const url = listItem.childNodes[1].ariaLabel;
					console.log(commentFolder);
					if (!this.app.vault.getAbstractFileByPath(commentFolder)) {
						await this.app.vault.createFolder(commentFolder);
					}
					if (!this.app.vault.getAbstractFileByPath(commentPath)) {
						await this.app.vault.create(
							commentPath,
							tFrontmatter(
								parseYaml(
									templateWithVariables(this.settings.notePropertysTemplate, {
										url: url,
										title: this.noteFile.basename,
									})
								)
							)
						);
					}
					this.app.workspace.getLeaf().setViewState({
						type: "markdown",
						state: {
							file: commentPath,
							mode: "source",
						},
					});
				})
		);
		menu.addItem((item) =>
			item
				.setTitle("看到这集")
				.setIcon("eye")
				.onClick(() => {
					const progress = this.frontmatter.progress;
					this.app.vault.process(this.noteFile, (data) =>
						data.replace(`progress: ${progress}`, `progress: ${index + 1}`)
					);
				})
		);
		menu.showAtMouseEvent(event);
	}
}
