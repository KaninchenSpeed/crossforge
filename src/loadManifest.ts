import fs from 'fs'
import cp from 'child_process'

export type manifestType = 'minecraftModpack' | 'minecraftMod'

export interface ManifestModLoader {
    id: string
    primary?: boolean
}

export interface ManifestFile {
    projectID: number
    fileID: number
    required: boolean
}

export interface Manifest {
    minecraft: {
        version: string
        modLoaders: ManifestModLoader[]
    }
    manifestType: manifestType
    manifestVersion: number
    name: string
    version: string
    author: string
    files: ManifestFile[]
    overrides: string
}

export const parseJSON = (file: string) => {
    const manifest: Manifest = JSON.parse(file)
    return manifest
}

export const loadfromJSON = (path: string) => {
    if (!fs.existsSync(path) || !fs.statSync(path).isFile()) throw 'file not found'
    const manifestFile = fs.readFileSync(path).toString()
    return parseJSON(manifestFile)
}

export const loadFromZip = (path: string) => {
    return new Promise<{ manifest: Manifest, outPath: string }>((res, rej) => {
        if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
            rej('no file found')
            return
        }

        const outPath = `${path.split('/').filter((v, i, arr) => i + 1 != arr.length).join('/')}/.tmp_curseforge`
        
        if (!cp.execSync('unzip').toString().match(/unzip/i)) {
            rej('unzip not installed')
            return
        }

        cp.execSync(`unzip ${path} -d ${outPath}`)
        
        res({
            manifest: loadfromJSON(`${outPath}/manifest.json`),
            outPath
        })
    })
}

export const autoLoad = async (path: string): Promise<{ manifest: Manifest, outPath?: string }> => {
    if (path.endsWith('.zip')) {
        return await loadFromZip(path)
    }
    if (path.endsWith('.json')) {
        return {
            manifest: loadfromJSON(path)
        }
    }
    throw 'nether zip or manifest.json found'
}

export const decideModLoader = (loaders: ManifestModLoader[]): ManifestModLoader => {
    if (loaders.length == 0) throw 'no loaders available'
    const primarys = loaders.filter((v) => v.primary)
    if (primarys.length > 0) return primarys[0]
    const sloaders = loaders.sort((a, b) => {
        const ida = Number(a.id.split('.').filter((v, i, arr) => i + 1 == arr.length).join('.'))
        const idb = Number(b.id.split('.').filter((v, i, arr) => i + 1 == arr.length).join('.'))
        return ida - idb
    })
    if (sloaders.length > 0) return sloaders[0]
}