import { request2 } from "../utils/obsidianUtils";

export default class bangumiApi {
	static async search(name: string) {
		// BUG: 不知道为什么，《梦想成为魔法少女》这部就是搜索不到。我听说过nsfw内容需要更多验证，不知道是不是因为这个。
		const animes = await request2("https://api.bgm.tv/v0/search/subjects", "POST", {
			keyword: name,
			filter: {
				type: [2],
			},
		});
		let result = animes["data"].find(
			(anime) => anime["name_cn"].toLowerCase() == name.toLowerCase()
		);
		if (!result) result = animes["data"][0];
		return result;
	}

	static async getMetadata(id: number) {
		const anime = await request2(`https://api.bgm.tv/v0/subjects/${id}`, "GET");
		return anime;
	}

	static async getEpisodes(id: number) {
		const episodes = await request2("https://api.bgm.tv/v0/episodes", "GET", {
			subject_id: id,
			type: 0,
		});
		return episodes["data"];
	}
}
