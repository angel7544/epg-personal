import { Storage } from '@freearhey/storage-js'
import { Logger } from '@freearhey/core'
import { Command } from 'commander'
import { loadData, data } from '../../api'
import path from 'node:path'
import fs from 'node:fs'

const program = new Command()
program
  .option('-i, --input <path...>', 'Path to input XML file(s)', ['./india.xml'])
  .option('-o, --output <path>', 'Path to output directory', '../vega-app/src/epg-data')
  .parse(process.argv)

const options = program.opts()

async function main() {
  const logger = new Logger()
  const outputDir = path.resolve(options.output)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const programmesByCleanName: Record<string, any[]> = {}
  const channelMap: Record<string, string> = {}

  // Regex setup
  const channelRegex = /<channel id="([^"]+)">\s*<display-name>(.*?)<\/display-name>/gs
  const progBlockRegex = /<programme\s+([^>]+)>(.*?)<\/programme>/gs
  const attrRegex = /(\w+(?:-\w+)?)\s*=\s*"([^"]+)"/g

  for (const xmlPath of options.input) {
    if (!fs.existsSync(xmlPath)) {
      logger.warn(`File not found: ${xmlPath}`)
      continue
    }

    logger.info(`Loading XML: ${xmlPath}...`)
    const xml = fs.readFileSync(xmlPath, 'utf8')

    // 1. Extract Channels
    let match
    while ((match = channelRegex.exec(xml)) !== null) {
      channelMap[match[1]] = match[2].replace(/&amp;/g, '&')
    }

    // 2. Extract Programmes
    let pMatch
    let countInFile = 0
    while ((pMatch = progBlockRegex.exec(xml)) !== null) {
      const rawAttrs = pMatch[1]
      const content = pMatch[2]

      const attrs: Record<string, string> = {}
      let attrMatch
      while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2]
      }

      if (!attrs.start || !attrs.stop || !attrs.channel) continue

      const channelId = attrs.channel
      const displayName = channelMap[channelId] || channelId
      const cleanName = cleanChannelName(displayName)

      const titleMatch = /<title[^>]*>(.*?)<\/title>/s.exec(content)
      const descMatch = /<desc[^>]*>(.*?)<\/desc>/s.exec(content)

      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : 'No Title'
      const desc = descMatch ? descMatch[1].replace(/&amp;/g, '&').trim() : ''

      if (!programmesByCleanName[cleanName]) {
        programmesByCleanName[cleanName] = []
      }

      const startObj = parseXmlTime(attrs.start)
      const stopObj = parseXmlTime(attrs.stop)

      programmesByCleanName[cleanName].push({
        ...attrs,
        channelId,
        channelName: displayName,
        start: startObj.display,
        stop: stopObj.display,
        startTs: startObj.ts,
        stopTs: stopObj.ts,
        title,
        desc
      })
      countInFile++
    }
    logger.info(`Parsed ${countInFile} programs from ${path.basename(xmlPath)}.`)
  }

  logger.info(`Writing files to ${outputDir}...`)
  for (const [cleanName, programs] of Object.entries(programmesByCleanName)) {
    programs.sort((a, b) => a.startTs - b.startTs)

    // Filter out programs that have already ended (keep buffer of 1 hour)
    const now = Date.now()
    const futurePrograms = programs.filter(p => p.stopTs > (now - 3600000))

    const uniquePrograms = []
    const seenStarts = new Set()
    for (const p of futurePrograms) {
      if (!seenStarts.has(p.startTs)) {
        uniquePrograms.push(p)
        seenStarts.add(p.startTs)
      }
    }

    // Sharding logic: use the first character of the filename as the subdirectory
    const filename = `${cleanName.replace(/\s+/g, '_')}_in.json`
    const shardDir = path.join(outputDir, filename.charAt(0).toLowerCase())
    if (!fs.existsSync(shardDir)) {
      fs.mkdirSync(shardDir, { recursive: true })
    }
    const filePath = path.join(shardDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(uniquePrograms, null, 2), 'utf8')
  }

  logger.success('Done!')
}

function cleanChannelName(name: string) {
  if (!name) return 'unknown'
  return name
    .toLowerCase()
    .replace(/^[a-z]{2}\s*-\s*/i, '')
    .replace(/&/g, 'and')
    .replace(/\s+(hd|sd|uhd|4k|1080p|720p|576p|fhd)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseXmlTime(timeStr: string) {
  const regex = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s+([+-]\d{4})$/
  const m = timeStr.match(regex)
  if (!m) return { ts: 0, display: '??:??' }

  const [y, mo, d, h, mi, s, offset] = m.slice(1)
  const isoStr = `${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`
  const date = new Date(isoStr)

  return {
    ts: date.getTime(),
    display: `${h}:${mi}`
  }
}

main().catch(console.error)
