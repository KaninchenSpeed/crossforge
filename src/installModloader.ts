import fs from 'fs'
import fetch from 'node-fetch-commonjs'
import * as config from './config'
import os from 'os'
import cp from 'child_process'

import type { ManifestModLoader } from './loadManifest'

export const installForge = async (modloader: ManifestModLoader, minecraft_version: string) => {
    console.log('downloading forge...')
    const id = modloader.id.split('-')[1]
    const url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${minecraft_version}-${id}/forge-${minecraft_version}-${id}-installer.jar`
    const mlres = await fetch(url)
    const mlfile = await mlres.arrayBuffer()
    fs.writeFileSync('.tmp_curseforge/forge_installer.jar', Buffer.from(mlfile), { encoding: 'binary' })
    console.log('downloaded forge')
    if (config.get()[config.bindings.minecraft_path] == `${os.homedir()}/.minecraft`) {
        console.warn(`
            =============================================================
                \tPLEASE DONT CHANGE ANYTHING IN THE FORGE INSTALLER!
            =============================================================
        `.replace(/ /g, '').replace(/\t/g, '    '))
    } else {
        console.warn(`
            =====================================================================
                \tPLEASE CHANGE THE INSTALLATION PATH IN THE FORGE INSTALLER!
            =====================================================================
        `.replace(/ /g, '').replace(/\t/g, '    '))
    }
    console.log('installing forge')
    const install_log = cp.execSync('java -jar .tmp_curseforge/forge_installer.jar').toString()
    console.log(install_log)
    if (fs.existsSync('forge_installer.jar.log')) fs.rmSync('forge_installer.jar.log')
    console.log('installed forge')
}