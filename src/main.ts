import { request, Plugin, parseYaml } from "obsidian";
import { AnimeParserModal } from "./modal";
import { Path } from "./utils/path";
import jetpack from "fs-jetpack";
import { tFrontmatter } from "./utils/obsidianUtils";
import { AnimeParserSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AnimeParserSettingTab } from "./settings/settingsTab";

export default class AnimeParserPlugin extends Plugin {
	settings: AnimeParserSettings;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AnimeParserSettingTab(this.app, this));
		this.addCommand({
			id: "anime-parsing",
			name: "Parse a local directory to a anime",
			callback: () => {
				new AnimeParserModal(this.app, async (input) => {
					await this.parseAnime(input);
				}).open();
			},
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async parseAnime(path: string) {
		const name = new Path(path).name;
		const data = await request({
			url: "https://api.bgm.tv/v0/search/subjects",
			method: "POST",
			body: JSON.stringify({
				keyword: name,
				filter: {
					type: [2],
				},
			}),
		});
		const id = JSON.parse(data)["data"][0]["id"];

		const anime = JSON.parse(
			await request({
				url: `https://api.bgm.tv/v0/subjects/${id}`,
				method: "GET",
			})
		);

		const cover = anime["images"]["common"];
		const summary = anime["summary"];
		// const tags= anime["tags"].map((tag)=>tag["name"]);
		const tags = ["anime"];

		const episodes = JSON.parse(
			await request({
				url: `https://api.bgm.tv/v0/episodes?subject_id=${id}&type=0`,
				method: "GET",
			})
		)["data"];
		const episodeNames = episodes.map((ep) => ep["name_cn"]);

		const videos = jetpack.find(path, { matching: ["*.mp4", "*.mkv"], recursive: false });

		const content = videos
			.map(
				(video, index) =>
					`- [ep${index + 1}. ${episodeNames[index]}](${video.replaceAll(" ", "%20")})`
			)
			.join("\n");

		const variables = new Map<string, string>([
			["cover", cover],
			["summary", summary.replaceAll(/\n/g, "")],
			["tags", tags],
		]);
		const propertys = parseYaml(
			Array.from(variables).reduce(
				(template, [key, value]) => template.replaceAll(`{{${key}}}`, value),
				this.settings.propertysTemplate
			)
		);
		await this.app.vault.create(name + ".md", tFrontmatter(propertys) + "\n" + content);
	}
}
