import * as path from "path";

export function parseEpisode(fileNames: string[]): string[] {
	const backup = [...fileNames];
	const commonSubstrings = findAllCommonSubstrings(fileNames);
	const fileNameMap = new Map();
	fileNames = fileNames.map((fileName) => {
		let modifiedFileName = fileName;
		commonSubstrings.forEach((subString) => {
			modifiedFileName = modifiedFileName.replace(subString, "");
		});
		fileNameMap.set(modifiedFileName, fileName);
		return modifiedFileName;
	});
	let maxEp = 1;
	while (fileNames.some((fileName) => fileName.includes(maxEp.toString()))) {
		maxEp++;
	}
	const startEp = maxEp - fileNames.length + 1;
	const indexs = Array.from({ length: fileNames.length }, (_, index) => index + startEp);
	const episodes: string[] = [];
	for (let i = indexs.length - 1; i >= 0; i--) {
		const index = indexs[i];
		const episode = fileNames
			.map((fileName) => ({
				fileName,
				count: path.basename(fileName).split(index.toString()).length - 1,
			}))
			.reduce((a, b) => (a.count > b.count ? a : b)).fileName;
		fileNames.splice(fileNames.indexOf(episode), 1);
		episodes.push(fileNameMap.get(episode));
	}
	fileNames.push(...backup);
	return episodes.reverse();
}

function findAllCommonSubstrings(strings: string[]): string[] {
	if (strings.length === 0) return [];

	const shortest = strings.reduce((a, b) => (a.length <= b.length ? a : b));

	const commonSubstrings = new Set<string>();

	for (let length = shortest.length; length > 0; length--) {
		for (let start = 0; start <= shortest.length - length; start++) {
			const substring = shortest.substring(start, start + length);
			if (strings.every((str) => str.includes(substring))) {
				commonSubstrings.add(substring);
			}
		}
	}

	const result: string[] = [];
	for (const substr of commonSubstrings) {
		if (!Array.from(commonSubstrings).some((s) => s !== substr && s.includes(substr))) {
			result.push(substr);
		}
	}

	return result;
}
