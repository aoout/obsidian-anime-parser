# Anime Parser

> [!WARNING]
> This is for my personal use and may contain serious bugs, please do not use it. If you really want to use it, please open an issue.

Parse a local directory to a anime.

![alt text](assets/screenshot.png)

## ⚡Usage

### Get the animes local resource that is stored correctly

This is a directory structure used for demonstration.

```
animes
├── Attack_on_Titan
│   ├── episode_1.mp4
│   ├── episode_2.mp4
│   └── ...
├── One_Piece
│   ├── episode_1.mp4
│   ├── episode_2.mp4
│   └── ...
└── Sword_Art_Online
    ├── episode_1.mp4
    ├── episode_2.mp4
    └── ...
```

**There shouldn't be any non-flat directory structure. Even different seasons of an anime.**

### Install && Set up the `media-extended` plugin

Create a custom protocols, select the `folder mapping` type, and map `animes` to the directory where anime local media files are stored.


Example: `anime -> file:///D:/Animes`。

### Import && Manage animes

Use the following code to create a dataviewJS block to create an animes bookshelf:

```js
// 下面是该Block的全部配置内容
const SourceFolder = "Animes"; // 数据来源是一个文件夹
const coverField = "cover"; // 想要作为封面展示的yaml 键名
const ItemProperties = {
	"封面": "$cover", // $cover会被替换为该Page的cover属性（以图片形式）
	"链接": (p) => p.file.link, // 使用箭头函数，定义项目的每一个属性
};
// 配置结束
const pages = dv.pages(`"${SourceFolder}"`).filter((p) => p[coverField]);

const generateCoverLink = (cover, filePath) =>
	`[![|200](<${cover}>)](<${filePath}>)`;

Promise.all(
	pages.map(async (page) => {
		const coverUrl = page[coverField].startsWith("http")
			? page[coverField]
			: app.vault.adapter.getResourcePath(p[coverField]);
		return Object.values(ItemProperties).map((value) =>
			value === "$cover"
				? generateCoverLink(coverUrl, page.file.path)
				: value(page)
		);
	})
).then((tdata) => dv.table(Object.keys(ItemProperties), tdata));
```

Then, import animes. And you are done.

## Propertys template

all available variables:

```
- {{cover}}
- {{id}}
- {{summary}}
- {{tags}}
- {{epNum}}
```

### Example Template

```
playlist: true
cover: {{cover}}
bangumiID: {{id}}
episodeNum: {{epNum}}
progress: 0
```

## 🖇️Unique and stable link

There are **some problems** with relying on local resource files to manage media files. What if one day I suddenly want to store my resource files in another path? What if I change computers and have the same resource files, but they cannot be recognized as the same item because of different file names? What if I share my library with others and they cannot correctly link notes to resource files?

The solution I thought of is to have a unique and stable link of a certain episode of a certain anime. This plugin runs on this concept, and in a broad sense, it is of course also a kind of **File over app**.