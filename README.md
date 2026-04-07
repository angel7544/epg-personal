# EPG [![update](https://github.com/iptv-org/epg/actions/workflows/update.yml/badge.svg)](https://github.com/iptv-org/epg/actions/workflows/update.yml)

> [!CAUTION]
> **LEGAL DISCLAIMER**: Use of these tools is subject to the laws of your jurisdiction. All data processed and displayed is retrieved from publicly available sources on the internet. We do not host, store, or redistribute any copyrighted media content. This repository provides automated tools for data aggregation and formatting for personal use only.

---

Tools for downloading the EPG (Electronic Program Guide) for thousands of TV channels from hundreds of sources.

## Table of contents

- [🤖 Automated Daily Updates](#automated-daily-updates)
- [✨ Installation](#installation)
- [🚀 Usage](#usage)
- [💫 Update](#update)
- [🐋 Docker](#docker)
- [📅 Guides](#guides)
- [🗄 Database](#database)
- [👨‍💻 API](#api)
- [📚 Resources](#resources)
- [💬 Discussions](#discussions)
- [🛠 Contribution](#contribution)
- [📄 License](#license)

## 🤖 Automated Daily Updates

This repository is now fully automated via GitHub Actions to handle **JioTV** and **Tata Play** EPG lifecycles:
- **JioTV & Tata Play Sync**: Automatically generates and aligns channel lists.
- **Multi-Source Grabbing**: Fetches individual XMLTV feeds for both providers.
- **Smart Extraction**: Consolidates multiple sources into a single, high-performance JSON library.
- **Sharded Architecture**: Organizes 1,200+ files into subdirectories (e.g., `s/star_plus_in.json`) to bypass GitHub's 1,000-file UI limit.

For detailed setup instructions, see [AUTOMATION.md](AUTOMATION.md).

## Installation

First, you need to install [Node.js](https://nodejs.org/en) on your computer. You will also need to install [Git](https://git-scm.com/downloads) to follow these instructions.

After that open the [Console](https://en.wikipedia.org/wiki/Windows_Console) (or [Terminal](<https://en.wikipedia.org/wiki/Terminal_(macOS)>) if you have macOS) and type the following command:

```sh
git clone --depth 1 -b master https://github.com/iptv-org/epg.git
```

This will copy all the code from the repository to your computer into the `epg` folder. After that, we just need to go to the folder we created:

```sh
cd epg
```

And install all the dependencies:

```sh
npm install
```

## Usage

To start the download of the guide, select one of the supported sites from [SITES.md](SITES.md) file and paste its name into the command below:

```sh
npm run grab --- --site=example.com
```

Then run it and wait for the guide to finish downloading. When finished, a new `guide.xml` file will appear in the current directory.

You can also customize the behavior of the script using this options:

```sh
Usage: npm run grab --- [options]

Options:
  -s, --site <name>             Name of the site to parse
  -c, --channels <path>         Path to *.channels.xml file (required if the "--site" attribute is
                                not specified)
  -o, --output <path>           Path to output file (default: "guide.xml")
  -l, --lang <codes>            Allows you to restrict downloading to channels in specified languages only (example: "en,id")
  -t, --timeout <milliseconds>  Timeout for each request in milliseconds (default: 30000)
  -d, --delay <milliseconds>    Delay between request in milliseconds (default: 0)
  -x, --proxy <url>             Use the specified proxy (example: "socks5://username:password@127.0.0.1:1234")
  --days <days>                 Number of days for which the program will be loaded (defaults to the value from the site config)
  --maxConnections <number>     Number of concurrent requests (default: 1)
  --gzip                        Specifies whether or not to create a compressed version of the guide (default: false)
  --curl                        Display each request as CURL (default: false)
```

### Parallel downloading

By default, the guide for each channel is downloaded one by one, but you can change this behavior by increasing the number of simultaneous requests using the `--maxConnections` attribute:

```sh
npm run grab --- --site=example.com --maxConnections=10
```

But be aware that under heavy load some sites may start return an error or completely block your access.

### Use custom channel list

Create an XML file and copy the descriptions of all the channels you need from the [/sites](sites) into it:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<channels>
  <channel site="arirang.com" lang="en" xmltv_id="ArirangTV.kr" site_id="CH_K">Arirang TV</channel>
  ...
</channels>
```

And then specify the path to that file via the `--channels` attribute:

```sh
npm run grab --- --channels=path/to/custom.channels.xml
```

### Run on schedule

If you want to download guides on a schedule, you can use [cron](https://en.wikipedia.org/wiki/Cron) or any other task scheduler. Currently, we use a tool called [chronos](https://github.com/freearhey/chronos) for this purpose.

To start it, you only need to specify the necessary `grab` command and [cron expression](https://crontab.guru/):

```sh
npx chronos --execute="npm run grab --- --site=example.com" --pattern="0 0,12 * * *" --log
```

For more info go to [chronos](https://github.com/freearhey/chronos) documentation.

### Access the guide by URL

You can make the guide available via URL by running your own server. The easiest way to do this is to run this command:

```sh
npx serve
```

After that, the guide will be available at the link:

```
http://localhost:3000/guide.xml
```

In addition it will be available to other devices on the same local network at the address:

```
http://<your_local_ip_address>:3000/guide.xml
```

For more info go to [serve](https://github.com/vercel/serve) documentation.

## Update

If you have downloaded the repository code according to the instructions above, then to update it will be enough to run the command:

```sh
git pull
```

And then update all the dependencies:

```sh
npm install
```

## Docker

### Pull an image

```sh
docker pull ghcr.io/iptv-org/epg:master
```

### Create and run container

```sh
docker run -p 3000:3000 -v /path/to/channels.xml:/epg/public/channels.xml ghcr.io/iptv-org/epg:master
```

By default, the guide will be downloaded every day at 00:00 UTC and saved to the `/epg/public/guide.xml` file inside the container.

From the outside, it will be available at this link:

```
http://localhost:3000/guide.xml
```

or

```
http://<your_local_ip_address>:3000/guide.xml
```

### Environment Variables

To fine-tune the execution, you can pass environment variables to the container as follows:

```sh
docker run \
-p 5000:3000 \
-v /path/to/channels.xml:/epg/public/channels.xml \
-e CRON_SCHEDULE="0 0,12 * * *" \
-e MAX_CONNECTIONS=10 \
-e GZIP=true \
-e CURL=true \
-e PROXY="socks5://127.0.0.1:1234" \
-e DAYS=14 \
-e TIMEOUT=5 \
-e DELAY=2 \
ghcr.io/iptv-org/epg:master
```

| Variable        | Description                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| CRON_SCHEDULE   | A [cron expression](https://crontab.guru/) describing the schedule of the guide loadings (default: "0 0 \* \* \*") |
| MAX_CONNECTIONS | Limit on the number of concurrent requests (default: 1)                                                            |
| GZIP            | Boolean value indicating whether to create a compressed version of the guide (default: false)                      |
| CURL            | Display each request as CURL (default: false)                                                                      |
| PROXY           | Use the specified proxy                                                                                            |
| DAYS            | Number of days for which the guide will be loaded (defaults to the value from the site config)                     |
| TIMEOUT         | Timeout for each request in milliseconds (default: 30000)                                                          |
| DELAY           | Delay between request in milliseconds (default: 0)                                                                 |
| RUN_AT_STARTUP  | Run grab on container startup (default: true)                                                                      |

## Guides

Any user can share the guides they have created with the rest of the community. A complete list of these guides and their current status can be found in the [GUIDES.md](GUIDES.md) file.

## Database

All channel data is taken from the [iptv-org/database](https://github.com/iptv-org/database) repository. If you find any errors please open a new [issue](https://github.com/iptv-org/database/issues) there.

## API

The API documentation can be found in the [iptv-org/api](https://github.com/iptv-org/api) repository.

## Resources

Links to other useful IPTV-related resources can be found in the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository.

## Discussions

If you have a question or an idea, you can post it in the [Discussions](https://github.com/orgs/iptv-org/discussions) tab.

## Contribution

Please make sure to read the [Contributing Guide](https://github.com/iptv-org/epg/blob/master/CONTRIBUTING.md) before sending [issue](https://github.com/iptv-org/epg/issues) or a [pull request](https://github.com/iptv-org/epg/pulls).

And thank you to everyone who has already contributed!

### Backers

<a href="https://opencollective.com/iptv-org"><img src="https://opencollective.com/iptv-org/backers.svg?width=890" /></a>

### Contributors

<a href="https://github.com/iptv-org/epg/graphs/contributors"><img src="https://opencollective.com/iptv-org/contributors.svg?width=890" /></a>

## License

[![CC0](http://mirrors.creativecommons.org/presskit/buttons/88x31/svg/cc-zero.svg)](LICENSE)

---

## 🎨 Creative Engineering & Performance Overhaul

This project has been significantly enhanced by **Angel Mehul Singh** (GitHub: [angel7544](https://github.com/angel7544)) to bring high-performance, real-time EPG management to modern IPTV applications.

### 🚀 Technical Evolution Map

```mermaid
graph LR
    subgraph "External Sources"
    S[Public Internet / IPTV-Org]
    end

    subgraph "EPG Transformation Engine"
    X[Raw XMLTV Feed] -->|JS Extraction| J[(Micro-JSON Nodes)]
### 🏗️ System Architecture: From Monolith to Distributed JSON

The transition from a 10MB monolithic XML feed to a Distributed JSON architecture has revolutionized client-side performance.

```mermaid
graph TD
    subgraph "External Providers"
    TP[Tata Play API]
    JIO[Jio TV API]
    end

    subgraph "Aggregation Layer"
    xml[Raw XMLTV Feeds]
    end

    subgraph "Transformation Engine (O1 Optimization)"
    sh[Sharded Extraction] --> |Hashing| S1[Shard A]
    sh --> |Hashing| S2[Shard B]
    sh --> |Hashing| Sn[Shard Z]
    end

    subgraph "Frontend Client (Vega App)"
    v[Virtual Grid] --> |O1 Lookup| Sn
    end

    TP --> xml
    JIO --> xml
    xml --> sh
```

### 📊 Data Relationship (ER Diagram)

This diagram shows how XMLTV attributes are mapped and distributed across the sharded storage system.

```mermaid
erDiagram
    XML-SOURCE {
        string channel_id
        string start_time
        string stop_time
        string title
    }
    SHARD {
        string prefix_key
        string folder_path
    }
    JSON-NODE {
        string filename
        array programs
    }

    XML-SOURCE ||--o{ SHARD : "extracted into"
    SHARD ||--o{ JSON-NODE : "contains"
```

### ⚡ Key Engineering Achievements:
- **Distributed Sharding**: Implemented a first-character hashing system to stay under GitHub's 1,000-file per directory UI limit while providing instantaneous file system lookups.
- **Automated Dual-Provider Ingestion**: Engineered a fully automated pipeline for **JioTV** and **Tata Play** that updates daily without manual intervention.
- **O(1) Search Complexity**: Re-architected the parsing engine to ensure clients can fetch channel data in constant time, bypassing the need to parse massive XML files on mobile devices.
- **Monthly Fresh Reset**: Integrated a smart cleanup strategy that on the 1st of every month clears the environment to prevent Git history bloat.
- **Memory-Safe Core**: Re-architected handling of large-scale feeds using optimized buffer management, preventing OOM (Out of Memory) crashes on low-end hardware.
- **Global Timer Synchronization**: Resolved complex timestamp formatting issues to ensure accurate live-program tracking across all time zones.
