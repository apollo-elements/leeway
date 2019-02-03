import filter from 'crocks/pointfree/filter';
import compose from 'crocks/helpers/compose';
import map from 'crocks/pointfree/map';
import chain from 'crocks/pointfree/chain';
import identity from 'crocks/combinators/identity';
import { JSDOM } from 'jsdom';
import { readFile as rf, writeFile as wf } from 'fs';
import { promisify } from 'util';

const INDEX = 'public/index.html';

const trace = tag => x => console.log(tag, x) || x;

const readFile = promisify(rf);
const writeFile = promisify(wf);

const flatten = chain(identity);
const lines = data => flatten(data.toString().split('\n').map(l => l.split('import')));
const includes = x => str => str.includes(x);
const matchImportChunk = line => line.match(/(?<chunk>chunk-([a-zA-Z0-9]){8}\.js)/);
const getChunkName = ({ groups: { chunk } }) => chunk;

const createLink = dom => file => {
  const link = dom.window.document.createElement('link');
  link.rel = 'modulepreload';
  link.href = `modules/${file}`;
  return link;
};

const linksFromLines = dom => compose(
  createLink(dom),
  trace('will preload'),
  getChunkName,
  matchImportChunk
);

async function preloadChunks() {
  const dom = await JSDOM.fromFile(INDEX);
  await readFile('./public/modules/app.js')
    .then(lines)
    .then(filter(includes('chunk')))
    .then(map(linksFromLines(dom)))
    .then(map(link => dom.window.document.head.appendChild(link)));
  await writeFile(INDEX, `<!DOCTYPE html>${dom.window.document.documentElement.outerHTML}`, 'utf-8')
}

preloadChunks();
