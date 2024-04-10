import { App, SuggestModal } from "obsidian";

export class Modal extends SuggestModal<string> {
	emptyStateText = "waittng for path inputting...";
	getSuggestions(): string[] | Promise<string[]> {
		return;
	}
	renderSuggestion() {
		return;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onChooseSuggestion() {
		return;
	}

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);

		this.inputEl.addEventListener("keyup", ({ key }) => {
			if (key === "Enter" && this.inputEl.value) {
				onSubmit(this.inputEl.value);
				this.close();
			}
		});
	}
}
