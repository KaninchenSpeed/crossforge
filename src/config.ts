import fs from 'fs'
import os from 'os'

export interface Config {
    api_key?: string
    ram: number
    minecraft_path: string
}


export const base: Config = {
    ram: 6,
    minecraft_path: `${os.homedir}/.minecraft`
}

export const bindings = {
    api: 'api_key',
    ram: 'ram',
    minecraft_path: 'minecraft_path'
}

export const exist = () => {
    return fs.existsSync('config.json')
}

export const get = (): Config | undefined => {
    if (!exist()) return
    return JSON.parse(fs.readFileSync('config.json').toString())
}

export const write = (newConfig: Config) => {
    fs.writeFileSync('config.json', JSON.stringify(newConfig, null, 4))
}

export const reset = () => {
    write(base)
}