#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {globby} from 'globby';
import {hideBin} from 'yargs/helpers';
import yargs from 'yargs/yargs';

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
        fs.mkdir(path.dirname(relativePath), {recursive: true}, (err) => {
            if (err) return reject(`Error creating folder: ${err.message}`);

            fs.writeFile(relativePath, data, 'utf8', (error) => {
                if (error) {
                    reject(`Error writing file: ${error.message}`);
                } else {
                    resolve();
                }
            });
        });
    });
}

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('directory', {
            alias: 'd',
            type: 'string',
            description: 'Coverage directory path (by default will be ./coverage)',
        })
        .option('output', {
            alias: 'o',
            type: 'string',
            description: 'Coverage output file path (by default will be lcov.info in coverage directory path)',
        })
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Enable verbose mode',
        })
        .help().argv;

    const verbose = argv.verbose;
    const coveragetFolderRelativePath = argv.directory ?? './coverage';
    const coveragetOutputRelativePath = argv.output ?? `${coveragetFolderRelativePath}/lcov.info`;

    const lcovPaths = await globby(`${coveragetFolderRelativePath}/**/**/lcov.info`);
    const lcovValidPaths = lcovPaths.filter((lcovPath) => lcovPath !== `${coveragetFolderRelativePath}/lcov.info`);

    if (verbose) {
        if (lcovValidPaths.length === 0) {
            console.log(`No coverage file found in "${coveragetFolderRelativePath}"!`);
        } else {
            console.log(`Found ${lcovValidPaths.length} coverage files in "${coveragetFolderRelativePath}":`);
            lcovValidPaths.forEach((lcovValidPath, index) => console.log(`${index + 1}. "${lcovValidPath}"`));
        }
    }

    const coverageDatum = await Promise.all(lcovValidPaths.map((lcovPath) => readFileRelative(lcovPath)));
    const mergedData = coverageDatum.join('\n');

    writeFileRelative(coveragetOutputRelativePath, mergedData)
        .then(() => {
            if (verbose) {
                console.log(`Output coverage file has been successfully stored in "${coveragetOutputRelativePath}"!`);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

main();
