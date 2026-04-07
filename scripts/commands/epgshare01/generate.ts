import { Storage } from '@freearhey/storage-js'
import { Collection, Logger } from '@freearhey/core'
import { EPGGrabber } from 'epg-grabber'
import { generateChannelsXML } from '../../core'
import { Channel } from '../../models'
import { loadData, data } from '../../api'

async function main() {
  const logger = new Logger()
  const storage = new Storage()

  logger.info('Loading iptv-org database...')
  await loadData()

  logger.info('Loading EPGShare01 channels...')
  const epgshare01XmlPath = 'sites/epgshare01.online/epgshare01.online_IN4.channels.xml'
  const xml = await storage.load(epgshare01XmlPath)
  const parsedChannels = EPGGrabber.parseChannelsXML(xml)
  
  const epgshare01Channels = new Collection(parsedChannels).map(
    (channel: Record<string, string>) => new Channel(channel as any)
  )

  logger.info(`Found ${epgshare01Channels.count()} channels. Aligning IDs...`)

  const alignedChannels = new Collection<Channel>()
  const m3uLines: string[] = ['#EXTM3U']

  epgshare01Channels.forEach((channel: Channel) => {
    let xmltvId = channel.xmltv_id

    // Attempt to find official ID if missing or for alignment
    if (!xmltvId) {
      const match = Object.values(data.channelsKeyById.data()).find((c: any) => 
        (c.name.toLowerCase() === channel.name.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '') === channel.name.toLowerCase().replace(/\s+/g, '')) &&
        c.country === 'IN'
      )

      if (match) {
        xmltvId = match.id
      } else {
        // Fallback
        xmltvId = `${channel.name.replace(/\s+/g, '').replace(/[^\w]/g, '')}.in`
      }
    }

    // Only include Indian channels
    const isIndian = xmltvId.endsWith('.in')
  
    if (isIndian) {
      channel.xmltv_id = xmltvId
      alignedChannels.add(channel)

      // Add to M3U
      const streamUrl = `http://localhost:5000/live/epgshare01/${channel.site_id}.m3u8`
      m3uLines.push(`#EXTINF:-1 tvg-id="${xmltvId}" tvg-logo="${channel.logo || ''}" group-title="EPGShare01",${channel.name}`)
      m3uLines.push(streamUrl)
    }
  })

  logger.info(`Matched ${alignedChannels.count()} Indian channels.`)

  // Save epgshare01.channels.xml
  const channelsXml = generateChannelsXML(alignedChannels)
  await storage.save('epgshare01.channels.xml', channelsXml)
  logger.info('Saved epgshare01.channels.xml')

  // Save epgshare01.m3u
  await storage.save('epgshare01.m3u', m3uLines.join('\n'))
  logger.info('Saved epgshare01.m3u')

  logger.success('Generation complete!')
}

main().catch(console.error)
