import { request, Plugin, Editor } from "obsidian";
import { Modal } from "./modal";
import { Path } from "./utils/path";
import jetpack from "fs-jetpack";

export default class ThePlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "anime-parsing",
			name: "Parse a local directory to a anime",
			editorCallback: (editor: Editor) => {
				new Modal(this.app, async (input) => {
					await this.parseAnime(editor, input);
				}).open();
			},
		});
	}

	async parseAnime(editor:Editor,path:string) {
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
		const anime = JSON.parse(data)["data"][0];
		const id = anime["id"];
		console.log(id);
		const episodes = JSON.parse(
			await request({
				url: `https://api.bgm.tv/v0/episodes?subject_id=${id}&type=0`,
				method: "GET"
			})
		)["data"];
		const episodeNames = episodes.map(ep=>ep["name_cn"]);
		console.log(episodeNames);
		// TODO: 读取path根目录下文件列表，将链接列表输入activeFile
		const videos = jetpack.find(path,{matching:["*.mp4"],recursive:false});
		console.log(videos);

		const content = videos.map((video,index) => `- [${episodeNames[index]}](${video})`).join("\n");
		editor.replaceRange(
			content,
			editor.getCursor()
		);
	}
}
