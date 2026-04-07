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

  logger.info('Loading Airtel Xstream channels...')
  const airtelXmlPath = 'sites/airtelxstream.in/airtelxstream.in.channels.xml'
  const xml = await storage.load(airtelXmlPath)
  const parsedChannels = EPGGrabber.parseChannelsXML(xml)
  
  const airtelChannels = new Collection(parsedChannels).map(
    (channel: Record<string, string>) => new Channel(channel as any)
  )

  logger.info(`Found ${airtelChannels.count()} channels. Aligning IDs...`)

  const alignedChannels = new Collection<Channel>()
  const m3uLines: string[] = ['#EXTM3U']

  airtelChannels.forEach((channel: Channel) => {
    let xmltvId = channel.xmltv_id || ''

    // Clean up suffixes (@SD, @HD, etc.)
    if (xmltvId.includes('@')) {
      xmltvId = xmltvId.split('@')[0]
    }

    // Attempt to find official ID if missing or invalid
    if (!xmltvId) {
      const match = Object.values(data.channelsKeyById.data()).find((c) => 
        c.name.toLowerCase() === channel.name.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '') === channel.name.toLowerCase().replace(/\s+/g, '')
      )

      if (match) {
        xmltvId = match.id
      } else {
        // Fallback to name-based ID if no match found
        xmltvId = `${channel.name.replace(/\s+/g, '')}.in`
      }
    }

    // Only include Indian channels (suffix .in or in database as IN)
    const officialChannel = data.channelsKeyById.get(xmltvId)
    const isIndian = xmltvId.endsWith('.in') || (officialChannel && officialChannel.country === 'IN')

    if (isIndian) {
      channel.xmltv_id = xmltvId
      alignedChannels.add(channel)

      // Add to M3U
      const streamUrl = `http://localhost:5000/live/airtel/${channel.site_id}.m3u8` // Placeholder for local proxy
      m3uLines.push(`#EXTINF:-1 tvg-id="${xmltvId}" tvg-logo="${channel.logo || ''}" group-title="AirtelXstream",${channel.name}`)
      m3uLines.push(streamUrl)
    }
  })

  logger.info(`Matched ${alignedChannels.count()} Indian channels.`)

  // Save india-airtel.channels.xml
  const channelsXml = generateChannelsXML(alignedChannels)
  await storage.save('india-airtel.channels.xml', channelsXml)
  logger.info('Saved india-airtel.channels.xml')

  // Save india-airtel.m3u
  await storage.save('india-airtel.m3u', m3uLines.join('\n'))
  logger.info('Saved india-airtel.m3u')

  logger.success('Generation complete!')
  logger.info('Now run: npm run grab -- --channels=india-airtel.channels.xml --output=india-airtel.xml')
}

main().catch(console.error)
