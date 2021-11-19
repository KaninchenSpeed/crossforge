import fs from 'fs'

export interface Config {
    api_key?: string
    ram: number
}


export const base: Config = {
    ram: 6
}

export const bindings = {
    api: 'api_key',
    ram: 'ram'
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