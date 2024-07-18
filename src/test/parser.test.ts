import { parseEpisode } from "../lib/parser";
import { generatePaddedSequence } from "../utils/utils";

describe("testing the episode parser", () => {
	test("test the parsing of general episode names", () => {
		const fileNames1 = [];
		generatePaddedSequence(11).forEach((index) => {
			fileNames1.push(
				`[桜都字幕组] 为美好的世界献上祝福！3 / Kono Subarashii Sekai ni Shukufuku wo! 3 [${index}][1080p][简体内嵌]`
			);
		});
		const parsed = parseEpisode(fileNames1);
		expect(parsed).toStrictEqual(fileNames1);
	});

	test("test the parsing of episode names for season n (n>1)", () => {
		const fileNames1 = [];
		generatePaddedSequence(13)
			.slice(11)
			.forEach((index) => {
				fileNames1.push(
					`[北宇治字幕组&霜庭云花Sub&氢气烤肉架]【我推的孩子】/【Oshi no ko】[${index}][WebRip][HEVC_AAC][简繁日内封]`
				);
			});
		const parsed = parseEpisode(fileNames1);
		expect(parsed).toStrictEqual(fileNames1);
	});
});
