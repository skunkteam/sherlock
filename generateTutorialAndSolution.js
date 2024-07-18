"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// import * as fs from 'fs';
var fs = require("node:fs/promises");
// Run with: tsc generateTutorialAndSolution.ts && node generateTutorialAndSolution.js
function generateTutorialAndSolutions() {
    return __awaiter(this, void 0, void 0, function () {
        var filenames, _i, filenames_1, filename, originalContent, tutorialContent, solutionContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readdir('generator')];
                case 1:
                    filenames = (_a.sent()).filter(function (f) { return f.endsWith("test.ts"); });
                    _i = 0, filenames_1 = filenames;
                    _a.label = 2;
                case 2:
                    if (!(_i < filenames_1.length)) return [3 /*break*/, 7];
                    filename = filenames_1[_i];
                    return [4 /*yield*/, fs.readFile("generator/".concat(filename), 'utf8')];
                case 3:
                    originalContent = _a.sent();
                    tutorialContent = originalContent
                        .replace(/describe(?!\.skip)/g, "describe.skip") // change `describe` to `describe.skip`
                        .replace(/\/\/ #QUESTION-BLOCK-(START|END)/g, "")
                        .replace(/\/\/ #QUESTION/g, "") // remove `// #QUESTION` comments
                        .replace(/\/\/ #ANSWER-BLOCK-START[\s\S]*?\/\/ #ANSWER-BLOCK-END/g, "") // remove // #ANSWER blocks
                        .replace(/\n.*?\/\/ #ANSWER/g, "") // remove the entire `// #ANSWER` line, including comment
                        .replace(/\n\s*\n\s*\n/g, "\n\n");
                    return [4 /*yield*/, fs.writeFile("generated_tutorial/".concat(filename), tutorialContent)];
                case 4:
                    _a.sent();
                    solutionContent = originalContent
                        .replace(/describe\.skip/g, "describe") // change `describe.skip` to `describe`
                        .replace(/\/\/ #ANSWER-BLOCK-(START|END)/g, "")
                        .replace(/\/\/ #ANSWER/g, "") // remove `// #ANSWER` comments
                        .replace(/\/\/ #QUESTION-BLOCK-START[\s\S]*?\/\/ #QUESTION-BLOCK-END/g, "") // remove // #QUESTION blocks
                        .replace(/\n.*?\/\/ #QUESTION/g, "") // remove the entire `// #QUESTION` line, including comment
                        .replace(/\n\s*\n\s*\n/g, "\n\n");
                    return [4 /*yield*/, fs.writeFile("generated_solution/".concat(filename), solutionContent)];
                case 5:
                    _a.sent();
                    console.log("\u001B[33m ".concat(filename, " saved! \u001B[0m"));
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/];
            }
        });
    });
}
generateTutorialAndSolutions();
