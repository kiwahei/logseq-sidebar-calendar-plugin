# Logseq Sidebar Calendar Plugin

Sidebar calendar plugin for logseq. (i only tested in logseq db!)

![Logseq Sidebar Calendar plugin Banner](https://raw.githubusercontent.com/kiwahei/logseq-sidebar-calendar-plugin/main/banner.png) 

---

## Features

- **Interactive Calendar Grid**: Easily navigate through months and years, and click on days to jump straight to their journal pages.
- **Flexible Date Formats**: Fully customizable format strings for Day, Week, Month, Quarter, and Year pages (using `date-fns` formatting rules).
- **Automated Page Tags**: Appends tags (like `#daily`, `#weekly-review`, or `#quarterly-goals`) automatically when creating new nodes.
- **Page Existence Indicators**: Days and labels display visual cues (dots for days, underlines for others) indicating if the corresponding page already exists in your Logseq graph.
- **Auto-Creation Options**: Can prompt for page creation or automatically create them instantly.
- **Dynamic Theme Integration**: Listens to Logseq theme changes to match your current light or dark UI aesthetics.
- **Customizable Start of Week**: Adapt the calendar layout with custom start-of-week settings, automatically synced with Logseq's graph configuration.

---

## Configuration & Settings

After installing the plugin, you can customize the following settings under **Settings > Plugins > Sidebar Calendar**:

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Start of Week** | `number` | `6` (Sunday) | Integer from `0` (Monday) to `6` (Sunday). Overrides or syncs with Logseq default settings. |
| **Day Format** | `string` | `MMM do, yyyy` | Format pattern for daily journal/page names (e.g. `yyyy-MM-dd`). |
| **Week Page Format** | `string` | `Wwww yyyy` | Format pattern for week page names (e.g. `yyyy-WII`). |
| **Month Page Format** | `string` | `MMMM yyyy` | Format pattern for month page names. |
| **Quarter Page Format** | `string` | `QQ yyyy` | Format pattern for quarter page names. |
| **Year Page Format** | `string` | `yyyy` | Format pattern for year page names. |
| **Day Page Tag** | `string` | *(empty)* | Optional tag(s) to append (e.g. `#daily #logs`). |
| **Week Page Tag** | `string` | *(empty)* | Optional tag(s) to append (e.g. `#weekly-review`). |
| **Month Page Tag** | `string` | *(empty)* | Optional tag(s) to append (e.g. `#monthly-goals`). |
| **Quarter Page Tag** | `string` | *(empty)* | Optional tag(s) to append. |
| **Year Page Tag** | `string` | *(empty)* | Optional tag(s) to append. |
| **Auto Create Empty Page** | `boolean` | `false` | If enabled, clicking a missing page automatically creates it without showing a confirmation overlay. |
| **Show Exist Indicator** | `boolean` | `true` | If enabled, renders visual indicators (dots/underlines) for pages that already exist in your graph. |

---

## Installation

### Manual Installation (Developer Mode)

1. Download the latest `logseq-sidebar-calendar-plugin.zip` from the [Releases](https://github.com/kiwahei/logseq-sidebar-calendar-plugin/releases) tab.
2. Extract the zip file locally.
3. Open Logseq and go to **Settings > Advanced**.
4. Enable **Developer Mode**.
5. Click **Load unpacked plugin** on the plugins page and select the extracted folder containing the `package.json` file.

### Via Logseq Marketplace (Soon!)

Once approved, you can search for **Calendar Widget** directly from the built-in Logseq Marketplace and click **Install**.

---

## Building from Source

If you want to compile the project yourself:

```bash
# Install dependencies
npm install

# Run Vite dev server
npm run dev

# Build production bundle
npm run build

# Package the zip file
npm run zip
```

---

## License

[MIT](LICENSE)
