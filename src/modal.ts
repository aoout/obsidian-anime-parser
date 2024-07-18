import jetpack from "fs-jetpack";
import { App, SuggestModal } from "obsidian";

export class AnimeParserModal extends SuggestModal<string> {
	libraryPath: string;
	onSumbit: (result: string) => void;
	constructor(app: App, libraryPath: string, onSumbit: (result: string) => void) {
		super(app);
		this.libraryPath = libraryPath;
		this.onSumbit = onSumbit;
	}
	getSuggestions(query: string): string[] | Promise<string[]> {
		return jetpack.list(this.libraryPath).filter((folder) => folder.includes(query));
	}

	renderSuggestion(value: string, el: HTMLElement) {
		el.createEl("div", { text: value });
	}

	onChooseSuggestion(item: string) {
		this.onSumbit(item);
	}
}
