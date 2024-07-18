// import * as fs from 'fs';
import * as fs from 'node:fs/promises';

// Run with: tsc generateTutorialAndSolution.ts && node generateTutorialAndSolution.js

async function generateTutorialAndSolutions() {
    // get all filenames in the folder 'tutorial' that end on '.ts'
    let filenames: string[] = (await fs.readdir('generator')).filter(f => f.endsWith(`test.ts`));

    for (let filename of filenames) {
        // // Read the original text file
        const originalContent = await fs.readFile(`generator/${filename}`, 'utf8');

        // ** TUTORIAL **
        let tutorialContent = originalContent
            .replace(/describe(?!\.skip)/g, `describe.skip`) // change `describe` to `describe.skip`
            .replace(/\/\/ #QUESTION-BLOCK-(START|END)/g, ``)
            .replace(/\/\/ #QUESTION/g, ``) // remove `// #QUESTION` comments
            .replace(/\/\/ #ANSWER-BLOCK-START[\s\S]*?\/\/ #ANSWER-BLOCK-END/g, ``) // remove // #ANSWER blocks
            .replace(/\n.*?\/\/ #ANSWER/g, ``) // remove the entire `// #ANSWER` line, including comment
            .replace(/\n\s*\n\s*\n/g, `\n\n`); // remove excess whitespaces/newlines

        await fs.writeFile(`generated_tutorial/${filename}`, tutorialContent);

        // ** SOLUTION **
        let solutionContent = originalContent
            .replace(/describe\.skip/g, `describe`) // change `describe.skip` to `describe`
            .replace(/\/\/ #ANSWER-BLOCK-(START|END)/g, ``)
            .replace(/\/\/ #ANSWER/g, ``) // remove `// #ANSWER` comments
            .replace(/\/\/ #QUESTION-BLOCK-START[\s\S]*?\/\/ #QUESTION-BLOCK-END/g, ``) // remove // #QUESTION blocks
            .replace(/\n.*?\/\/ #QUESTION/g, ``) // remove the entire `// #QUESTION` line, including comment
            .replace(/\n\s*\n\s*\n/g, `\n\n`); // remove excess whitespaces/newlines

        await fs.writeFile(`generated_solution/${filename}`, solutionContent);
        console.log(`\x1b[33m ${filename} saved! \x1b[0m`);
    }
}

generateTutorialAndSolutions();
