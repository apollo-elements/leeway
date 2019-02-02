import filter from 'crocks/pointfree/filter';
import compose from 'crocks/helpers/compose';
import map from 'crocks/pointfree/map';
import { JSDOM } from 'jsdom';
import { readFile as rf, writeFile as wf } from 'fs';
import { promisify } from 'util';

const INDEX = 'public/index.html';

const readFile = promisify(rf);
const writeFile = promisify(wf);

const lines = data => data.toString().split('\n');
const includes = x => str => str.includes(x);
const matchImportChunk = line => line.match(/(?<chunk>chunk-([a-zA-Z0-9]){8}\.js)/);
const getChunkName = ({ groups: { chunk } }) => chunk;

const createLink = dom => file => {
  const link = dom.window.document.createElement('link');
  link.rel = 'modulepreload';
  link.href = `modules/${file}`;
  return link;
};

const linksFromLines = dom => compose(createLink(dom), getChunkName, matchImportChunk);

async function preloadChunks() {
  const dom = await JSDOM.fromFile(INDEX);
  await readFile('./public/modules/app.js')
    .then(lines)
    .then(filter(includes('chunk')))
    .then(map(linksFromLines(dom)))
    .then(map(link => dom.window.document.head.appendChild(link)));
  await writeFile(INDEX, dom.window.document.documentElement.outerHTML, 'utf-8')
}

preloadChunks();
