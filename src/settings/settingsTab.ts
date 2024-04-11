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
			.setName("propertysTemplate")
			.setDesc("propertysTemplate")
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.propertysTemplate)
					.onChange(async (value) => {
						this.plugin.settings.propertysTemplate = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
