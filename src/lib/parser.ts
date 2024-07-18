export function parseEpisode(fileNames: string[]): string[] {
	const backup = [...fileNames];
	const episodeMap = new Map();
	fileNames.forEach(fileName => {
		const match = fileName.match(
			/(?![^ []])(第|未删减|_)?(?<episode>\d+)(话|話|集|v2|先行版)?(?![^ \]])/
		);
		if (match) {
			episodeMap.set(fileName, Number(match[1]));
		}
	});
	const episodes = Array.from(episodeMap.entries()).sort((a, b) => a[1] - b[1]).map(([fileName]) => fileName);
	fileNames = [];
	fileNames.push(...backup);
	return episodes;
}
