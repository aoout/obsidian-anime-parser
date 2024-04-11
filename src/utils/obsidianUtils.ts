import { stringifyYaml } from "obsidian";

export function tFrontmatter(propertys: unknown) {
	return "---\n" + stringifyYaml(propertys) + "\n---";
}
