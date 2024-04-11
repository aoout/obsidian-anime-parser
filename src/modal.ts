import { App } from "obsidian";
import { InputModal } from "./utils/obsidianUtils";

export class AnimeParserModal extends InputModal {
	emptyStateText = "waittng for path inputting...";

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app, onSubmit);
	}
}
