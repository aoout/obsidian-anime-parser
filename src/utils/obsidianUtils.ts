import { App, SuggestModal, stringifyYaml, request } from "obsidian";

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

export async function request2(url: string, method: string, params?: object) {
	if (method == "GET") {
		console.log(params);
		if (params) {
			const queryString = Object.keys(params)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
				.join("&");
			url = `${url}?${queryString}`;
		}
		return JSON.parse(
			await request({
				url: url,
				method: method,
			})
		);
	} else if (method == "POST") {
		return JSON.parse(
			await request({
				url: url,
				method: method,
				body: JSON.stringify(params),
			})
		);
	}
}

export function templateWithVariables(template: string, variables: object) {
	return Object.keys(variables).reduce(
		(template, key) => template.replaceAll(`{{${key}}}`, variables[key]),
		template
	);
}
