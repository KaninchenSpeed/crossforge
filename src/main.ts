import fs from 'fs'
import fse from 'fs-extra'
import fetch from 'node-fetch-commonjs'
import os from 'os'
import cp from 'child_process'
import { autoLoad, decideModLoader } from './loadManifest.js'
import * as config from './config.js'
import { addProfile } from './launcher.js'


const [ nodePath, context, cmd, ...args ] = process.argv


if (!config.exist()) config.reset()

switch (cmd) {
    case 'info': {
        autoLoad(args[0]).then(({ manifest, outPath }) => {
            console.log(`
                Info:
                    \tName: ${manifest.name}
                    \tAuthor: ${manifest.author}
                    \tMods: ${manifest.files.length}
                    \tVersion: ${manifest.version}
                    \tVersion: ${manifest.minecraft.version}
                    \tModloader: ${decideModLoader(manifest.minecraft.modLoaders).id}
            `.replace(/    /g, '').replace(/\t/g, '    '))
            if (outPath) fs.rmSync(outPath, { maxRetries: 2, retryDelay: 500, recursive: true })
        }).catch(err => {
            console.error(err)
        })
    } break
    case 'config':
    case 'c': {
        switch (args[0]) {
            case 's':
            case 'set': {
                const prop = args[1]
                const val = args[2]
                
                if (!Object.keys(config.bindings).includes(prop)) {
                    console.error(`property "${prop}" not found`)
                    break
                }
                if (val == '' || val == undefined) {
                    console.error('no value set')
                    break
                }
                const aconf = config.get() ?? config.base
                aconf[config.bindings[prop]] = val
                config.write(aconf)
                console.log(`${prop} set to ${val}`)
                console.log(`
                    this function can be broken when used with special characters
                    try using crossforge config import <path_to_file_containing_value>
                    the file should only contain the value
                `.replace(/    /g, '').replace(/\t/g, '    '))
            } break
            case 'g':
            case 'get': {
                const prop = args[1]
                if (!Object.keys(config.bindings).includes(prop)) {
                    console.error(`property "${prop}" not found`)
                    break
                }
                console.log(`${prop}: ${config.get()[config.bindings[prop]]}`)
            } break
            case 'l':
            case 'list': {
                console.log(`
                    Config:
                        \t${Object.keys(config.bindings).join('\t')}
                `.replace(/    /g, '').replace(/\t/g, '    '))
            } break
            case 'i':
            case 'import': {
                if (args[2] == '' || args[2] == undefined || !fs.existsSync(args[2]) || !fs.statSync(args[2]).isFile()) {
                    console.error('no file found')
                    break
                }
                const prop = args[1]
                const val = fs.readFileSync(args[2]).toString()

                if (!Object.keys(config.bindings).includes(prop)) {
                    console.error(`property "${prop}" not found`)
                    break
                }

                const aconf = config.get() ?? config.base
                aconf[config.bindings[prop]] = val
                config.write(aconf)
                console.log(`${prop} set to ${val}`)
            } break
            default:
            case 'h':
            case 'help': {
                console.log(`
                    Config help:
                        \thelp: crossforge config [h/help]
                        \tlist propertys: crossforge config [l/list]
                        \tset property: crossforge config [s/set] <property> <value>
                        \tget property: crossforge config [g/get] <property>
                        \timport property: crossforge config [i/import] <property> <path_to_file_containing_value>
                `.replace(/    /g, '').replace(/\t/g, '    '))
            } break
        }
    } break
    case 'install':
    case 'i': {
        if (!fs.existsSync(`${os.homedir()}/.minecraft`)) {
            console.error('no Minecraft Java Edition install found!')
            break
        }
        if (!config.get().api_key) {
            console.error('no api key set!')
            console.log('crossforge config set api <your_api_key>')

            break
        }
        if (!fs.existsSync(`${os.homedir()}/.minecraft/modpacks`)) {
            console.warn('no modpack folder found!')
            console.log('creating modpack folder...')
            fs.mkdirSync(`${os.homedir()}/.minecraft/modpacks`)
        }

        console.log('loading manifest...')
        autoLoad(args[0]).then(async ({ manifest, outPath }) => {
            console.log('loaded manifest')

            const path = `${os.homedir()}/.minecraft/modpacks/${manifest.name.replace(/ /g, '_')}`

            console.log('checking for duplicates...')
            if (fs.existsSync(path)) {
                console.log('failed')
                console.error('modpack already installed!')
                if (outPath) fs.rmSync(outPath, { maxRetries: 2, retryDelay: 500, recursive: true })
                return
            }
            console.log('passed')
            
            console.log('creating directorys...')
            fs.mkdirSync(path)
            fs.mkdirSync(`${path}/mods`)
            console.log('surcess')
            
            console.log('downloading mods...')
            await Promise.all(manifest.files.map<Promise<void>>(async file => {
                console.log(`loading download url of project ${file.projectID}, file ${file.fileID}`)
                
                const res = await fetch(`https://api.curseforge.com/v1/mods/${file.projectID}/files/${file.fileID}/download-url`, {
                    headers: {
                        'Accept': 'application/json',
                        'x-api-key': config.get().api_key
                    }
                })
                const resTxt = await res.text()
                const url: string = JSON.parse(resTxt).data
                const fn = url.split('/').filter((v, i, arr) => i + 1 == arr.length)[0]
                console.log(`downloading ${fn} ...`)
                const fileRes = await fetch(url)
                const fileBuffer = await fileRes.arrayBuffer()
                fs.writeFileSync(`${path}/mods/${fn}`, Buffer.from(fileBuffer), { encoding: 'binary' })
                console.log(`downloaded ${fn}`)
            }))
            console.log('mod download finished')

            if (outPath) {
                console.log('copying overrides...')
                fse.cpSync(`${outPath}/${manifest.overrides}`, path, { force: true, recursive: true })
                console.log('copied overrides')
            }

            console.log('finding modloader version...')
            const modloader = decideModLoader(manifest.minecraft.modLoaders)
            const modloadertype = modloader.id.split('-')[0]
            console.log(`detected ${modloadertype} modloader`)
            switch (modloadertype) {
                case 'forge': {
                    console.log('downloading forge...')
                    const id = modloader.id.split('-')[1]
                    const url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${manifest.minecraft.version}-${id}/forge-${manifest.minecraft.version}-${id}-installer.jar`
                    const mlres = await fetch(url)
                    const mlfile = await mlres.arrayBuffer()
                    fs.writeFileSync('.tmp_curseforge/forge_installer.jar', Buffer.from(mlfile), { encoding: 'binary' })
                    console.log('downloaded forge')
                    console.warn(`
                    ===========================================================
                        \tPLEASE DONT CHANGE ANYTHING IN THE FORGE INSTALLER!
                    ===========================================================
                    `.replace(/    /g, '').replace(/\t/g, '    '))
                    console.log('installing forge')
                    const install_log = cp.execSync('java -jar .tmp_curseforge/forge_installer.jar').toString()
                    console.log(install_log)
                    if (fs.existsSync('forge_installer.jar.log')) fs.rmSync('forge_installer.jar.log')
                    console.log('installed forge')
                    console.log('adding minecraft launcher profile...')
                    addProfile(manifest.name, path, `${manifest.minecraft.version}-forge${manifest.minecraft.version}-${modloader.id}`, 'Brick', 5)
                    console.log('added minecraft launcher profile')
                } break
                default: {
                    console.error(`Modloader ${modloadertype} not supported! Submit an issue on github please.`)
                } break
            }

            console.log(`Sucressfully installed ${manifest.name}`)

            if (outPath) fs.rmSync(outPath, { maxRetries: 2, retryDelay: 500, recursive: true })
        })
        
    } break
    case 'help':
    case 'h':
    default: {
        console.log(`
            === CrossForge ===
                \tThis is the helppage of crossforge.

                \tpath_to_modpack can be the path to the zip file or the manifest.json file.
                \tAll other files will be ignored when installing a modpack using a manifest.json file.

                \thelp: crossforge [h/help]
                \tinfo about a modpack: crossforge info <path_to_modpack>
                \tinstall a modpack: crossforge [i/install] <path_to_modpack>
                \tconfiguration help: crossforge config help

                \tGithub: https://github.com/KaninchenSpeed/crossforge
                \tNPM: https://www.npmjs.com/package/crossforge
        `.replace(/    /g, '').replace(/\t/g, '    '))
    } break
}