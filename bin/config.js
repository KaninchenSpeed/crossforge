import fs from 'fs';
export const base = {
    ram: 6
};
export const bindings = {
    api: 'api_key',
    ram: 'ram'
};
export const exist = () => {
    return fs.existsSync('config.json');
};
export const get = () => {
    if (!exist())
        return;
    return JSON.parse(fs.readFileSync('config.json').toString());
};
export const write = (newConfig) => {
    fs.writeFileSync('config.json', JSON.stringify(newConfig, null, 4));
};
export const reset = () => {
    write(base);
};
