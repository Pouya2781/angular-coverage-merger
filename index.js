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

function convertCoverageDataToLineArray(data) {
    return data.split('\n');
}

function normalizeCoverageDataLines(dataLines) {
    if (dataLines.length <= 2) {
        return [];
    }
    return dataLines.slice(1, dataLines.length - 1);
}

function mergeNormalizedCoverageDataLines(allDataLines) {
    return allDataLines.flat();
}

function finalizeCoverageDataLines(dataLines) {
    if (dataLines.length === 0) {
        return ['TN:', 'end_of_record'];
    }
    return ['TN:', ...dataLines, 'end_of_record'];
}

function convertCoverageDataLinestoData(dataLines) {
    return dataLines.join('\r\n');
}


async function main() {
    const coveragetFolderRelativePath = process.argv[2] ?? './coverage';
    const lcovPaths = await globby(`${coveragetFolderRelativePath}/**/**/lcov.info`);
    const lcovValidPaths = lcovPaths.filter(lcovPath => lcovPath !== `${coveragetFolderRelativePath}/lcov.info`);
    console.log('files', lcovValidPaths)

    const coverageDatum = await Promise.all(lcovValidPaths.map(lcovPath => readFileRelative(lcovPath)))
    console.log('data', coverageDatum);

    const coverageDataLines = coverageDatum.map(coverageData => normalizeCoverageDataLines(convertCoverageDataToLineArray(coverageData)))
    const mergedCoverageDataLines = mergeNormalizedCoverageDataLines(coverageDataLines);
    const finalizedCoverageDataLines = finalizeCoverageDataLines(mergedCoverageDataLines);
    const finalCoverageData = convertCoverageDataLinestoData(finalizedCoverageDataLines);

    writeFileRelative(`${coveragetFolderRelativePath}/lcov.info`, finalCoverageData).catch((error) => {
        console.error(error);
    })
}

main();