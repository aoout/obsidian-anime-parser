import AnimeParserPlugin from "../main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class AnimeParserSettingTab extends PluginSettingTab {
	plugin: AnimeParserPlugin;
	constructor(app: App, plugin: AnimeParserPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("libraryPath")
			.setDesc("libraryPath")
			.addText((text) =>
				text.setValue(this.plugin.settings.libraryPath).onChange(async (value) => {
					this.plugin.settings.libraryPath = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("savePath")
			.setDesc("savePath")
			.addText((text) =>
				text.setValue(this.plugin.settings.savePath).onChange(async (value) => {
					this.plugin.settings.savePath = value;
					await this.plugin.saveSettings();
				})
			);
		new Setting(containerEl)
			.setName("propertysTemplate")
			.setDesc("propertysTemplate")
			.addTextArea((text) =>
				text.setValue(this.plugin.settings.yamlTemplate).onChange(async (value) => {
					this.plugin.settings.yamlTemplate = value;
					await this.plugin.saveSettings();
				})
			);
		new Setting(containerEl)
			.setName("notePropertysTemplate")
			.setDesc("notePropertysTemplate")
			.addTextArea((text) =>
				text.setValue(this.plugin.settings.noteYamlTemplate).onChange(async (value) => {
					this.plugin.settings.noteYamlTemplate = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("accessToken")
			.setDesc("accessToken")
			.addText((text) =>
				text.setValue(this.plugin.settings.accessToken).onChange(async (value) => {
					this.plugin.settings.accessToken = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
