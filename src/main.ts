import { request, Plugin } from "obsidian";
import { Modal } from "./modal";
import { Path } from "./utils/path";
import jetpack from "fs-jetpack";
import { tFrontmatter } from "./utils/obsidianUtils";

export default class ThePlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "anime-parsing",
			name: "Parse a local directory to a anime",
			callback: () => {
				new Modal(this.app, async (input) => {
					await this.parseAnime(input);
				}).open();
			},
		});
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

		const videos = jetpack.find(path, { matching: ["*.mp4","*.mkv"], recursive: false });

		const content = videos
			.map((video, index) => `- [ep${index + 1}. ${episodeNames[index]}](${video.replaceAll(" ","%20")})`)
			.join("\n");

		await this.app.vault.create(
			name + ".md",
			tFrontmatter({
				cover: cover,
				summary: summary,
				tags: tags,
			}) +
				"\n" +
				content
		);
	}
}
