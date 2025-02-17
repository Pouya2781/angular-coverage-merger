#!/usr/bin/env node
import fs from 'fs'
import {globby} from 'globby'

function readFileRelative(relativePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(relativePath, 'utf8', (error, data) => {
            if (error) {
                reject(`Error reading file: ${error.message}`);
            } else {
                resolve(data);
            }
        });
    });
}

function writeFileRelative(relativePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(relativePath, data, 'utf8', (error) => {
            if (error) {
                reject(`Error reading file: ${error.message}`);
            } else {
                resolve();
            }
        });
    });
}


async function main() {
    const coveragetFolderRelativePath = process.argv[2] ?? './coverage';
    const lcovPaths = await globby(`${coveragetFolderRelativePath}/**/**/lcov.info`);
    const lcovValidPaths = lcovPaths.filter(lcovPath => lcovPath !== `${coveragetFolderRelativePath}/lcov.info`);

    const coverageDatum = await Promise.all(lcovValidPaths.map(lcovPath => readFileRelative(lcovPath)))
    const mergedData = coverageDatum.join('\n');

    writeFileRelative(`${coveragetFolderRelativePath}/lcov.info`, mergedData).catch((error) => {
        console.error(error);
    })
}

main();