// adapeted from https://stackoverflow.com/questions/5559712/how-to-reliably-hash-javascript-objects
import { Md5 } from 'ts-md5';

export function sortObjectKeys(obj: any): any {
    if (obj == null || obj == undefined) {
        return obj;
    }
    if (typeof obj != 'object') {
        // it is a primitive: number/string (in an array)
        return obj;
    }
    return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            if (Array.isArray(obj[key])) {
                acc[key] = obj[key].map(sortObjectKeys);
            } else if (typeof obj[key] === 'object') {
                acc[key] = sortObjectKeys(obj[key]);
            } else {
                acc[key] = obj[key];
            }
            return acc;
        }, {} as any);
}

export function hash(obj: any): string {
    const SortedObject: any = sortObjectKeys(obj);
    const jsonstring = JSON.stringify(SortedObject, function (_, v) {
        return v === undefined ? 'undef' : v;
    });

    // Remove all whitespace
    const jsonstringNoWhitespace: string = jsonstring.replace(/\s+/g, '');
    return Md5.hashStr(jsonstringNoWhitespace);
}
