import fs from 'fs'
import os from 'os'

export type icon = 'Brick'
export type launch_type = 'custom'

export interface Profile {
    created: string
    gameDir: string
    icon: icon
    javaArgs: string
    lastUsed: string
    lastVersionId: string
    name: string
    type: launch_type
}

export interface Launcher_JSON {
    clientToken: '',
    launcherVersion: {
        format: string
        name: string
        profilesFormat: 1 | 2
    }
    profiles: { [key: string]: Profile }
}

export const addProfile = (name: string, gameDir: string, forgeString: string, icon: icon, ramG: number) => {
    const profile: Profile = {
        created: (new Date()).toISOString(),
        javaArgs: `-Xmx${ramG}G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M`,
        lastUsed: (new Date()).toISOString(),
        type: 'custom',
        lastVersionId: forgeString,
        gameDir, name, icon
    }
    const profileJSON: Launcher_JSON = JSON.parse(fs.readFileSync(`${os.homedir()}/.minecraft/launcher_profiles.json`).toString())
    profileJSON.profiles[name] = profile
    fs.writeFileSync(`${os.homedir()}/.minecraft/launcher_profiles.json`, JSON.stringify(profileJSON, null, 2))
}