import { stringifyYaml, request, Pos, EditorRange } from "obsidian";

export function tFrontmatter(propertys: unknown) {
	return "---\n" + stringifyYaml(propertys) + "\n---";
}

function parseReponse(reponse) {
	try {
		return JSON.parse(reponse);
	} catch {
		return reponse;
	}
}

export async function request2(
	url: string,
	method: string,
	headers?: Record<string, string>,
	params?: object
) {
	if (method == "GET") {
		if (params) {
			const queryString = Object.keys(params)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
				.join("&");
			url = `${url}?${queryString}`;
		}
		return parseReponse(
			await request({
				url: url,
				headers: headers,
				method: method,
			})
		);
	} else if (method == "POST" || method == "PATCH") {
		return parseReponse(
			await request({
				url: url,
				headers: headers,
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

export function pos2EditorRange(pos: Pos): EditorRange {
	return {
		from: {
			ch: pos["start"].col,
			line: pos["start"].line,
		},
		to: {
			ch: pos["end"].col,
			line: pos["end"].line,
		}
	};
}
