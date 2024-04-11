import { Path } from "../utils/path";

export function parseEpisode(fileNames: string[]): string[] {
	const backup = [...fileNames];
	const indexs = Array.from({ length: fileNames.length }, (_, index) => index + 1);
	const episodes: string[] = [];
	for (let i = indexs.length - 1; i >= 0; i--) {
		const index = indexs[i];
		const episode = fileNames
			.map((fileName) => ({
				fileName,
				count: new Path(fileName).stem.split(index.toString()).length - 1,
			}))
			.reduce((a, b) => (a.count > b.count ? a : b)).fileName;
		fileNames.splice(fileNames.indexOf(episode), 1);
		episodes.push(episode);
	}
	fileNames.push(...backup);
	return episodes.reverse();
}
