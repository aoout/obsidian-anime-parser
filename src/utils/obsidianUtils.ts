import { App, SuggestModal, stringifyYaml } from "obsidian";

export class InputModal extends SuggestModal<string> {
	emptyStateText = "waittng for path inputting...";
	getSuggestions(): string[] {
		return;
	}
	renderSuggestion() {
		return;
	}
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

export function tFrontmatter(propertys: unknown) {
	return "---\n" + stringifyYaml(propertys) + "\n---";
}
