import fs from 'fs';
import os from 'os';
export const addProfile = (name, gameDir, forgeString, icon, ramG) => {
    const profile = {
        created: (new Date()).toISOString(),
        javaArgs: `-Xmx${ramG}G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M`,
        lastUsed: (new Date()).toISOString(),
        type: 'custom',
        lastVersionId: forgeString,
        gameDir, name, icon
    };
    const profileJSON = JSON.parse(fs.readFileSync(`${os.homedir()}/.minecraft/launcher_profiles.json`).toString());
    profileJSON.profiles[name] = profile;
    fs.writeFileSync(`${os.homedir()}/.minecraft/launcher_profiles.json`, JSON.stringify(profileJSON, null, 2));
};
