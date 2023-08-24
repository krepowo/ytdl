const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const { savefrom } = require('@bochilteam/scraper')
const os = require('os');
// const diskusage = require('diskusage');
// const client = require('./bot/index.js')
const { default: axios } = require("axios")
// const Discord = require("discord.js")
const si = require("systeminformation")
const app = express();
const token = process.env.token
let totalYT = 0, totalIGFB = 0

app.use(cors())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Method', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("https://dlvid.link")
})
app.get('/download', async (req, res) => {
  try {
    const { url, format, filename } = req.query;

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    let options;
    if (format === 'mp3') {
      options = { quality: 'highestaudio', filter: 'audioonly' };
      res.header('Content-Type', 'audio/mpeg');
    } else if (format === 'mp4') {
      options = { quality: 18 };
      res.header('Content-Type', 'video/mp4');
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }
    totalYT++
    const encodedFilename = encodeURIComponent(filename);
    res.header('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

    ytdl(url, options).pipe(res);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
app.get('/downloadv2', async (req, res) => {
  try {
    const { url } = req.query;
    const data = await savefrom(url)
    totalIGFB++
    res.send(data)
  } catch (error) {
    res.status(400).send({ error: true, reason: "url not found" })
  }
})
app.get('/info', async (req, res) => {
  const { url } = req.query;
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  const { videoDetails } = await ytdl.getBasicInfo(url)
  res.send({
    videoDetails
  })
})
app.get('/status', (req, res) => {
  res.send("<h1>OKE</h1>")
})
app.get('/usage', async(req, res) => {
  const cpuUsage = Math.round(process.cpuUsage().system / 1000000)
  const memUsage = await si.mem().then((data) => {
    const totalMemory = Math.round(data.total / 1024 / 1024)
    const freeMemory = Math.round(data.free / 1024 / 1024)
    const usedMemory = totalMemory - freeMemory
    const usedMemoryPercentage = Math.round((usedMemory / totalMemory) * 100)
    return `${usedMemory}MB/${totalMemory}MB (${usedMemoryPercentage}%)`
  })
  const disks = await si.fsSize().then((data) => {
    let diskUsage = ""
    data.forEach((disk) => {
      if (disk.mount !== "/home/runner/video-dl-api") return
      const totalDisk = Math.round(disk.size / 1024 / 1024)
      const freeDisk = Math.round(disk.available / 1024 / 1024)
      const usedDisk = totalDisk - freeDisk
      const usedDiskPercentage = Math.round((usedDisk / totalDisk) * 100)
      diskUsage += "```" + "\n" + disk.mount + "\n" + usedDisk + "MB/" + totalDisk + "MB (" + usedDiskPercentage + "%" + ")\n" + "```";
    })
    return diskUsage
  })
  const netUsage = await si.networkStats().then((data) => {
    const bytesIn = data[0].rx_sec
    const bytesOut = data[0].tx_sec
    const kbytesIn = bytesIn / 1024
    const kbytesOut = bytesOut / 1024
    return `\`⬇\`: ${kbytesIn.toFixed(2)} KB/s \`⬆\`: ${kbytesOut.toFixed(2)} KB/s`
  })
  const totalDL = await axios.get('http://localhost:3000/count').then((data) => {
    let yt = data.data.yt
    let other = data.data.other
    return `YT: ${yt} | Other: ${other}`
  })
  const now = new Date();
  const serveruptime = os.uptime();
  const uptimedays = Math.floor(serveruptime / (24 * 60 * 60));
  const uptimehours = Math.floor((serveruptime % (24 * 60 * 60)) / (60 * 60));
  const uptimeminutes = Math.floor((serveruptime % (60 * 60)) / 60);
  const uptimeseconds = Math.floor(serveruptime % 60);
  const uptimemessage = `${uptimedays}d ${uptimehours}h ${uptimeminutes}m ${uptimeseconds}s`
  // const statusMessage = `**CPU Usage:** ${cpuUsage}%\n**Memory Usage:** ${memUsage}\n**Disk Usage:**\n${disks}**Network Usage:** ${netUsage}\n**Uptime:** ${uptimemessage}\n**Total DL:** ${totalDL}\n**Last Update:** ${now.toLocaleString()}(<t:${Math.floor(Date.now() / 1000)}:R>)`;
  const status = {
    "CPU Usage": `${cpuUsage}%`,
    "Memory Usage": memUsage,
    "Disk Usage": disks,
    "Network Usage": netUsage,
    "Uptime": uptimemessage,
    "Total DL": totalDL,
    "Last Update": now.toLocaleString() + `(<t:${Math.floor(Date.now() / 1000)}:R>)`,
  };
  res.send(status)
});
app.get('/count', (req, res) => {
  res.send({
    yt: totalYT,
    other: totalIGFB
  })
})

// Start the server
const port = 3000;
// client.login(token)
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});