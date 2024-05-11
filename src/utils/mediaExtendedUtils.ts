import { App } from "obsidian";

export async function open(app: App, url: string) {
	await app.workspace.getLeaf().setViewState({
		type: "mx-url-video",
		state: {
			source: url,
		},
	});
}
