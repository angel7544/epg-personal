import { Storage } from '@freearhey/storage-js'
import { Collection, Logger } from '@freearhey/core'
import { EPGGrabber } from 'epg-grabber'
import { generateChannelsXML } from '../../core'
import { Channel } from '../../models'
import { loadData, data } from '../../api'
import path from 'node:path'

async function main() {
  const logger = new Logger()
  const storage = new Storage()

  logger.info('Loading iptv-org database...')
  await loadData()

  logger.info('Loading Jio TV channels...')
  const jiotvXmlPath = 'sites/jiotv.com/jiotv.com.channels.xml'
  const xml = await storage.load(jiotvXmlPath)
  const parsedChannels = EPGGrabber.parseChannelsXML(xml)
  
  const jiotvChannels = new Collection(parsedChannels).map(
    (channel: any) => new Channel(channel)
  )

  logger.info(`Found ${jiotvChannels.count()} channels. Aligning IDs...`)

  const alignedChannels = new Collection<Channel>()
  const m3uLines: string[] = ['#EXTM3U']

  jiotvChannels.forEach((channel: Channel) => {
    let xmltvId = channel.xmltv_id

    // Attempt to find official ID if missing
    if (!xmltvId) {
      // Direct lookup by name in iptv-org database
      const match = Object.values(data.channelsKeyById.data()).find((c: any) => 
        c.name.toLowerCase() === channel.name.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '') === channel.name.toLowerCase().replace(/\s+/g, '')
      )

      if (match) {
        xmltvId = match.id
      } else {
        // Fallback to site_id if no match found
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
      const streamUrl = `http://localhost:5000/live/${channel.site_id}.m3u8` // Default placeholder
      m3uLines.push(`#EXTINF:-1 tvg-id="${xmltvId}" tvg-logo="${channel.logo || ''}" group-title="JioTV",${channel.name}`)
      m3uLines.push(streamUrl)
    }
  })

  logger.info(`Matched ${alignedChannels.count()} Indian channels.`)

  // Save india.channels.xml
  const channelsXml = generateChannelsXML(alignedChannels)
  await storage.save('india.channels.xml', channelsXml)
  logger.info('Saved india.channels.xml')

  // Save india.m3u
  await storage.save('india.m3u', m3uLines.join('\n'))
  logger.info('Saved india.m3u')

  logger.success('Generation complete!')
  logger.info('Now run: npm run grab --- --channels=india.channels.xml --output=india.xml')
}

main().catch(console.error)
