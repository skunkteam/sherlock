// import * as fs from 'fs';
import { assert } from 'node:console';
import * as fs from 'node:fs/promises';

// Run with: tsc generateTutorialAndSolution.ts && node generateTutorialAndSolution.js

const generatorFolder = 'generator';
const tutorialFolder = 'tutorial';
const solutionFolder = 'solution';

async function generateTutorialAndSolutions() {
    // get all filenames in the folder 'tutorial' that end on '.ts'
    let filenames: string[] = (await fs.readdir(generatorFolder)).filter(f => f.endsWith(`test.ts`));

    for (let filename of filenames) {
        // // Read the original text file
        const originalContent = await fs.readFile(`${generatorFolder}/${filename}`, 'utf8');

        // ** TUTORIAL **
        let tutorialContent = originalContent
            .replace(/describe(?!\.skip)/g, `describe.skip`) // change `describe` to `describe.skip`
            .replace(/\n.*?\/\/ #QUESTION-BLOCK-(START|END)/g, ``)
            .replace(/\/\/ #QUESTION/g, ``) // remove `// #QUESTION` comments
            .replace(/\n.*?\/\/ #ANSWER-BLOCK-START[\s\S]*?\/\/ #ANSWER-BLOCK-END/g, ``) // remove // #ANSWER blocks
            .replace(/\n.*?\/\/ #ANSWER/g, ``); // remove the entire `// #ANSWER` line, including comment
        // .replace(/\n\s*\n\s*\n/g, `\n\n`); // remove excess whitespaces/newlines

        await fs.writeFile(`${tutorialFolder}/${filename}`, tutorialContent);

        // ** SOLUTION **
        let solutionContent = originalContent
            .replace(/describe\.skip/g, `describe`) // change `describe.skip` to `describe`
            .replace(/\n.*?\/\/ #ANSWER-BLOCK-(START|END)/g, ``)
            .replace(/\/\/ #ANSWER/g, ``) // remove `// #ANSWER` comments
            .replace(/\n.*?\/\/ #QUESTION-BLOCK-START[\s\S]*?\/\/ #QUESTION-BLOCK-END/g, ``) // remove // #QUESTION blocks
            .replace(/\n.*?\/\/ #QUESTION/g, ``); // remove the entire `// #QUESTION` line, including comment
        // .replace(/\n\s*\n\s*\n/g, `\n\n`); // remove excess whitespaces/newlines

        await fs.writeFile(`${solutionFolder}/${filename}`, solutionContent);
        console.log(`\x1b[33m ${filename} saved! \x1b[0m`);
    }

    // These tests will not cause any failing, but are just nice to have.
    // e.g. instead of removing excess whitespaces/newlines, we now just prevent them altogether.
    filenames = (await fs.readdir(generatorFolder)).filter(f => f.endsWith(`test.ts`)); // the names are the same in all three folders
    for (let filename of filenames) {
        for (let foldername of [tutorialFolder, solutionFolder]) {
            let content = await fs.readFile(`${foldername}/${filename}`, 'utf8');
            assert(content.match(/\n\s*\n\s*\n/) === null, `no 2 consecutive empty lines in ${foldername}/${filename}`);
            assert(
                !content.includes('#QUESTION') && !content.includes('#ANSWER'),
                `no '#QUESTION' or '#ANSWER' in ${foldername}/${filename}`,
            );
        }
    }
}

generateTutorialAndSolutions();
