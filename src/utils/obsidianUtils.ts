import { stringifyYaml, request } from "obsidian";

export function tFrontmatter(propertys: unknown) {
	return "---\n" + stringifyYaml(propertys) + "\n---";
}

export async function request2(url: string, method: string, params?: object) {
	if (method == "GET") {
		if (params) {
			const queryString = Object.keys(params)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
				.join("&");
			url = `${url}?${queryString}`;
		}
		return JSON.parse(
			await request({
				url: url,
				method: method,
			})
		);
	} else if (method == "POST") {
		return JSON.parse(
			await request({
				url: url,
				method: method,
				body: JSON.stringify(params),
			})
		);
	}
}

export function templateWithVariables(template: string, variables: object) {
	return Object.keys(variables).reduce(
		(template, key) => template.replaceAll(`{{${key}}}`, variables[key]),
		template
	);
}
