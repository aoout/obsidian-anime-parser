export function parseEpisode(fileNames: string[]):string[] {
	const indexs = Array.from({ length: fileNames.length }, (_, index) => index + 1);
	const episodes: string[] = [];
	for (let i = indexs.length - 1; i >= 0; i--) {
		const index = indexs[i];
		const items = fileNames.filter((fileName) => fileName.includes(index.toString()));
		if (items.length === 1) {
			const episode = items[0];
			fileNames.splice(fileNames.indexOf(episode), 1);
			episodes.push(episode);
		} else {
			fileNames = fileNames.map((fileName) => fileName.replace(index.toString(), ""));
			i++;
		}
	}
	return episodes.reverse();
}