import { request2 } from "../utils/obsidianUtils";

const BASEURL = "https://api.bgm.tv/";

function caseInsensitiveEqual(str1, str2) {
	return str1.toLowerCase() == str2.toLowerCase();
}

export default class bangumiApi {
	static async search(name: string) {
		// BUG: 不知道为什么，《梦想成为魔法少女》这部就是搜索不到。我听说过nsfw内容需要更多验证，不知道是不是因为这个。
		const animes = await request2(
			`${BASEURL}v0/search/subjects`,
			"POST",
			{},
			{
				keyword: name,
				filter: {
					type: [2],
				},
			}
		);
		let result = animes["data"].find((anime) => caseInsensitiveEqual(anime["name_cn"], name));
		if (!result) result = animes["data"][0];
		return result;
	}

	static async getMetadata(id: number) {
		const anime = await request2(`${BASEURL}v0/subjects/${id}`, "GET");
		return anime;
	}

	static async getEpisodes(id: number) {
		const episodes = await request2(
			`${BASEURL}v0/episodes`,
			"GET",
			{},
			{
				subject_id: id,
				type: 0,
			}
		);
		return episodes["data"];
	}

	static async updateProgress(accessToken: string, id: number, progress: number) {
		const episodes = await this.getEpisodes(id);
		const episodeIds = episodes.map((episode) => episode["id"]);
		return await request2(
			`${BASEURL}v0/users/-/collections/${id}/episodes`,
			"PATCH",
			{
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			{
				episode_id: episodeIds.slice(0, progress),
				type: 2,
			}
		);
	}
}
