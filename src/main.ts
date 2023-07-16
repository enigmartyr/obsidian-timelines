import type { TimelinesSettings } from './types';
import { TimelinesSettingTab, DEFAULT_SETTINGS } from './settings';
import { TimelineProcessor } from './block';
import { Plugin, MarkdownView } from 'obsidian';

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		await this.loadSettings();
		console.log('Loaded Plugin: Timelines (Revamped)');
		const proc = new TimelineProcessor(this.settings);

		// Register timeline block renderer
		this.registerMarkdownCodeBlockProcessor('ob-timeline', async (source, el, ctx) => {
			await proc.run(source, el, this.app.vault.getMarkdownFiles(), this.app.metadataCache, this.app.vault, false);
		});

		// Register vis-timeline block renderer
		this.registerMarkdownCodeBlockProcessor('ob-timeline-flat', async (source, el, ctx) => {
			await proc.run(source, el, this.app.vault.getMarkdownFiles(), this.app.metadataCache, this.app.vault, true);
		});

		this.addCommand({
			id: "render-timeline",
			name: "Render Static Timeline",
			callback: async () => {
				let view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					await proc.insertTimelineIntoCurrentNote(view, this.app.vault.getMarkdownFiles(), this.app.metadataCache, this.app.vault);
				}
			}
		});

		this.addSettingTab(new TimelinesSettingTab(this.app, this));
	}

	onunload() {
		console.log('Unloaded Plugin: Timelines (Revamped)');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
